#!/usr/bin/env node

console.log('🖨️ PrintEasy QR - Print Functionality Verification');
console.log('================================================');

const http = require('http');
const url = require('url');

function testEndpoint(testName, path, expectedHeaders) {
    return new Promise((resolve) => {
        console.log(`\n🧪 ${testName}`);
        console.log(`📍 Testing: ${path}`);
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'HEAD'
        };

        const req = http.request(options, (res) => {
            console.log(`   Status: ${res.statusCode}`);
            
            let allPassed = true;
            for (const [header, expected] of Object.entries(expectedHeaders)) {
                const actual = res.headers[header.toLowerCase()];
                const passed = actual && actual.includes(expected);
                console.log(`   ${header}: ${actual} ${passed ? '✅' : '❌'}`);
                if (!passed) allPassed = false;
            }
            
            resolve({ passed: allPassed, status: res.statusCode });
        });

        req.on('error', (e) => {
            console.error(`   ❌ Error: ${e.message}`);
            resolve({ passed: false, error: e.message });
        });

        req.end();
    });
}

async function runTests() {
    const tests = [
        {
            name: 'PDF Inline Display (Print Mode)',
            path: '/api/download/uploads/1755198203765-0-test.pdf?inline=true',
            expectedHeaders: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline'
            }
        },
        {
            name: 'PDF Print Mode',
            path: '/api/download/uploads/1755198203765-0-test.pdf?print=true',
            expectedHeaders: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': 'inline'
            }
        },
        {
            name: 'PDF Download Mode (should be attachment)',
            path: '/api/download/uploads/1755198203765-0-test.pdf?download=true',
            expectedHeaders: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment'
            }
        }
    ];

    let totalPassed = 0;
    
    for (const test of tests) {
        const result = await testEndpoint(test.name, test.path, test.expectedHeaders);
        if (result.passed) {
            totalPassed++;
            console.log(`   🎉 PASSED`);
        } else {
            console.log(`   💥 FAILED`);
        }
    }
    
    console.log('\n📊 FINAL RESULTS');
    console.log('================');
    console.log(`✅ Passed: ${totalPassed}/${tests.length}`);
    console.log(`❌ Failed: ${tests.length - totalPassed}/${tests.length}`);
    
    if (totalPassed === tests.length) {
        console.log('\n🎉 ALL TESTS PASSED! PDF printing should work correctly.');
        console.log('✅ Print dialogs should open directly without downloads.');
    } else {
        console.log('\n⚠️  Some tests failed. Print functionality may have issues.');
    }
    
    // Test print-host endpoint
    console.log('\n🧪 Testing Print Host HTML');
    const printHostResult = await testPrintHost();
    if (printHostResult.success) {
        console.log('✅ Print host HTML served successfully');
    } else {
        console.log('❌ Print host HTML test failed');
    }
}

function testPrintHost() {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/print-host?file=/api/download/uploads/1755198203765-0-test.pdf&type=pdf',
            method: 'GET'
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const success = res.statusCode === 200 && 
                              data.includes('PDF URL') && 
                              data.includes('PrintEasy QR - Direct Print Host');
                resolve({ success, status: res.statusCode });
            });
        });

        req.on('error', (e) => {
            resolve({ success: false, error: e.message });
        });

        req.end();
    });
}

runTests().catch(console.error);