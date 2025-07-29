import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { MoreHorizontal, Ban, RotateCcw, Trash2, ShieldX } from 'lucide-react';

interface Shop {
  id: number;
  name: string;
  status?: 'active' | 'deactivated' | 'banned';
  [key: string]: any;
}

interface ShopManagementDropdownProps {
  shop: Shop;
  onUpdate: () => void;
}

export default function ShopManagementDropdown({ shop, onUpdate }: ShopManagementDropdownProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleShopAction = async (action: 'deactivate' | 'activate' | 'ban' | 'delete') => {
    setIsLoading(true);
    try {
      let response;
      
      if (action === 'delete') {
        response = await fetch(`/api/admin/shops/${shop.id}`, {
          method: 'DELETE',
        });
      } else {
        response = await fetch(`/api/admin/shops/${shop.id}/${action}`, {
          method: 'PATCH',
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} shop`);
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: data.message,
      });

      onUpdate();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action} shop`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-brand-yellow';
      case 'deactivated': return 'text-gray-600';
      case 'banned': return 'text-rich-black';
      default: return 'text-gray-600';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'deactivated': return 'Deactivated';
      case 'banned': return 'Banned';
      default: return 'Unknown';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          disabled={isLoading}
          className="bg-white border-brand-yellow text-rich-black hover:bg-brand-yellow/5"
        >
          <MoreHorizontal className="w-4 h-4" />
          Manage
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1 text-xs text-medium-gray">
          Status: <span className={getStatusColor(shop.status)}>{getStatusText(shop.status)}</span>
        </div>
        <DropdownMenuSeparator />
        
        {shop.status === 'active' && (
          <>
            <DropdownMenuItem
              onClick={() => handleShopAction('deactivate')}
              className="text-gray-600 focus:text-gray-600"
            >
              <ShieldX className="w-4 h-4 mr-2" />
              Deactivate Shop
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleShopAction('ban')}
              className="text-rich-black focus:text-rich-black"
            >
              <Ban className="w-4 h-4 mr-2" />
              Ban Shop
            </DropdownMenuItem>
          </>
        )}

        {shop.status === 'deactivated' && (
          <>
            <DropdownMenuItem
              onClick={() => handleShopAction('activate')}
              className="text-green-600 focus:text-green-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Activate Shop
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleShopAction('ban')}
              className="text-red-600 focus:text-red-600"
            >
              <Ban className="w-4 h-4 mr-2" />
              Ban Shop
            </DropdownMenuItem>
          </>
        )}

        {shop.status === 'banned' && (
          <DropdownMenuItem
            onClick={() => handleShopAction('activate')}
            className="text-green-600 focus:text-green-600"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Activate Shop
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleShopAction('delete')}
          className="text-red-600 focus:text-red-600"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Shop
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}