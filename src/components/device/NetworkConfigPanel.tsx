import { useState } from 'react';
import { NetworkConfig } from '@/types/deviceConfig';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Network, Save, TestTube, Loader2 } from 'lucide-react';

interface NetworkConfigPanelProps {
  config: NetworkConfig;
  onChange: (config: NetworkConfig) => void;
  onSave: (config: NetworkConfig) => Promise<void>;
  onTest: () => Promise<boolean>;
  isLoading: boolean;
  isTesting: boolean;
}

export function NetworkConfigPanel({
  config,
  onChange,
  onSave,
  onTest,
  isLoading,
  isTesting,
}: NetworkConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (field: keyof NetworkConfig, value: string | boolean) => {
    const updated = { ...localConfig, [field]: value };
    setLocalConfig(updated);
    onChange(updated);
  };

  const handleSave = async () => {
    await onSave(localConfig);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Network Configuration
        </CardTitle>
        <CardDescription>
          Configure IP address and network settings for the camera
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="dhcp">Enable DHCP</Label>
          <Switch
            id="dhcp"
            checked={localConfig.dhcpEnabled}
            onCheckedChange={(checked) => handleChange('dhcpEnabled', checked)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ipAddress">IP Address</Label>
            <Input
              id="ipAddress"
              value={localConfig.ipAddress}
              onChange={(e) => handleChange('ipAddress', e.target.value)}
              disabled={localConfig.dhcpEnabled}
              placeholder="192.168.1.100"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subnetMask">Subnet Mask</Label>
            <Input
              id="subnetMask"
              value={localConfig.subnetMask}
              onChange={(e) => handleChange('subnetMask', e.target.value)}
              disabled={localConfig.dhcpEnabled}
              placeholder="255.255.255.0"
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gateway">Default Gateway</Label>
          <Input
            id="gateway"
            value={localConfig.gateway}
            onChange={(e) => handleChange('gateway', e.target.value)}
            disabled={localConfig.dhcpEnabled}
            placeholder="192.168.1.1"
            className="font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primaryDns">Primary DNS</Label>
            <Input
              id="primaryDns"
              value={localConfig.primaryDns}
              onChange={(e) => handleChange('primaryDns', e.target.value)}
              placeholder="8.8.8.8"
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondaryDns">Secondary DNS</Label>
            <Input
              id="secondaryDns"
              value={localConfig.secondaryDns}
              onChange={(e) => handleChange('secondaryDns', e.target.value)}
              placeholder="8.8.4.4"
              className="font-mono"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={onTest}
            disabled={isTesting}
            className="flex-1"
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <TestTube className="h-4 w-4 mr-2" />
            )}
            Test Connection
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
