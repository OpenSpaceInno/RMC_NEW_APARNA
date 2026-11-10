import { useState } from 'react';
import { useDeviceConfig } from '@/hooks/useDeviceConfig';
import { DeviceList } from '@/components/device/DeviceList';
import { EditDeviceDialog } from '@/components/device/EditDeviceDialog';
import { NetworkConfigPanel } from '@/components/device/NetworkConfigPanel';
import { VideoConfigPanel } from '@/components/device/VideoConfigPanel';
import { ImageConfigPanel } from '@/components/device/ImageConfigPanel';
import { ANPRConfigPanel } from '@/components/device/ANPRConfigPanel';
import { WebhookConfigPanel } from '@/components/device/WebhookConfigPanel';
import { RTSPConfigPanel } from '@/components/device/RTSPConfigPanel';
import { FtpConfigPanel } from '@/components/device/FtpConfigPanel';
import { LiveStreamViewer } from '@/components/device/LiveStreamViewer';
import { DeviceActions } from '@/components/device/DeviceActions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Network, Video, Image, ScanLine, Webhook, Settings, Radio, FolderSync } from 'lucide-react';
import { CameraDevice } from '@/types/deviceConfig';

export default function DeviceConfig() {
  const {
    devices,
    selectedDevice,
    isLoading,
    isTesting,
    networkConfig,
    videoConfig,
    imageConfig,
    anprConfig,
    webhookConfig,
    rtspConfig,
    selectDevice,
    refreshDevices,
    saveNetworkConfig,
    saveVideoConfig,
    saveImageConfig,
    saveANPRConfig,
    saveWebhookConfig,
    saveRTSPConfig,
    testConnection,
    testWebhook,
    testRTSPStream,
    rebootDevice,
    addDevice,
    updateDevice,
    deleteDevice,
    toggleCameraDashboard,
    exportDeviceConfig,
    setNetworkConfig,
    setVideoConfig,
    setImageConfig,
    setANPRConfig,
    setWebhookConfig,
    setRTSPConfig,
    ftpConfig,
    setFtpConfig,
    saveFtpConfig,
    testFtpConfig,
    isTestingFtp,
  } = useDeviceConfig();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<CameraDevice | null>(null);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-7 w-7" />
            Device Configuration
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage ANPR camera settings and network configuration
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Device List - Left Panel */}
        <div className="col-span-12 lg:col-span-3">
          <DeviceList
            devices={devices}
            selectedDevice={selectedDevice}
            onSelectDevice={selectDevice}
            onRefresh={refreshDevices}
            onAddDevice={addDevice}
            onUpdateDevice={updateDevice}
            onToggleDashboard={toggleCameraDashboard}
            isLoading={isLoading}
          />
        </div>

        {/* Configuration Panels - Right Panel */}
        <div className="col-span-12 lg:col-span-9">
          {selectedDevice ? (
            <div className="grid grid-cols-12 gap-6">
              {/* Configuration Tabs */}
              <div className="col-span-12 xl:col-span-8">
                <Tabs defaultValue="rtsp" className="w-full">
                  <TabsList className="grid grid-cols-7 w-full">
                    <TabsTrigger value="rtsp" className="flex items-center gap-1">
                      <Radio className="h-4 w-4" />
                      <span className="hidden sm:inline">RTSP</span>
                    </TabsTrigger>
                    <TabsTrigger value="network" className="flex items-center gap-1">
                      <Network className="h-4 w-4" />
                      <span className="hidden sm:inline">Network</span>
                    </TabsTrigger>
                    <TabsTrigger value="video" className="flex items-center gap-1">
                      <Video className="h-4 w-4" />
                      <span className="hidden sm:inline">Video</span>
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex items-center gap-1">
                      <Image className="h-4 w-4" />
                      <span className="hidden sm:inline">Image</span>
                    </TabsTrigger>
                    <TabsTrigger value="anpr" className="flex items-center gap-1">
                      <ScanLine className="h-4 w-4" />
                      <span className="hidden sm:inline">ANPR</span>
                    </TabsTrigger>
                    <TabsTrigger value="webhook" className="flex items-center gap-1">
                      <Webhook className="h-4 w-4" />
                      <span className="hidden sm:inline">Webhook</span>
                    </TabsTrigger>
                    <TabsTrigger value="ftp" className="flex items-center gap-1 text-amber-400 data-[state=active]:text-amber-300">
                      <FolderSync className="h-4 w-4" />
                      <span className="hidden sm:inline">FTP Details</span>
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-6">
                    <TabsContent value="rtsp">
                      <RTSPConfigPanel
                        config={rtspConfig}
                        onChange={setRTSPConfig}
                        onSave={saveRTSPConfig}
                        onTestStream={testRTSPStream}
                        isLoading={isLoading}
                        isTesting={isTesting}
                        deviceIp={selectedDevice?.ipAddress || ''}
                      />
                    </TabsContent>

                    <TabsContent value="network">
                      <NetworkConfigPanel
                        config={networkConfig}
                        onChange={setNetworkConfig}
                        onSave={saveNetworkConfig}
                        onTest={testConnection}
                        isLoading={isLoading}
                        isTesting={isTesting}
                      />
                    </TabsContent>

                    <TabsContent value="video">
                      <VideoConfigPanel
                        config={videoConfig}
                        onChange={setVideoConfig}
                        onSave={saveVideoConfig}
                        isLoading={isLoading}
                      />
                    </TabsContent>

                    <TabsContent value="image">
                      <ImageConfigPanel
                        config={imageConfig}
                        onChange={setImageConfig}
                        onSave={saveImageConfig}
                        isLoading={isLoading}
                      />
                    </TabsContent>

                    <TabsContent value="anpr">
                      <ANPRConfigPanel
                        config={anprConfig}
                        onChange={setANPRConfig}
                        onSave={saveANPRConfig}
                        isLoading={isLoading}
                      />
                    </TabsContent>

                    <TabsContent value="webhook">
                      <WebhookConfigPanel
                        config={webhookConfig}
                        onChange={setWebhookConfig}
                        onSave={saveWebhookConfig}
                        onTest={testWebhook}
                        isLoading={isLoading}
                        isTesting={isTesting}
                      />
                    </TabsContent>

                    <TabsContent value="ftp">
                      <FtpConfigPanel
                        config={ftpConfig}
                        onChange={setFtpConfig}
                        onSave={saveFtpConfig}
                        onTest={testFtpConfig}
                        isLoading={isLoading}
                        isTesting={isTestingFtp}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              {/* Device Actions & Live Stream - Side Panel */}
              <div className="col-span-12 xl:col-span-4 space-y-6">
                <LiveStreamViewer
                  device={selectedDevice}
                  rtspConfig={rtspConfig}
                />
                <DeviceActions
                  device={selectedDevice}
                  onReboot={rebootDevice}
                  onExportConfig={exportDeviceConfig}
                  onDeleteDevice={deleteDevice}
                  onToggleDashboard={toggleCameraDashboard}
                  onEditDevice={(dev) => {
                    setEditingDevice(dev);
                    setIsEditModalOpen(true);
                  }}
                  isLoading={isLoading}
                />
              </div>
            </div>
          ) : (
            <Card className="h-[400px] flex items-center justify-center">
              <CardContent className="text-center">
                <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No Device Selected
                </h3>
                <p className="text-muted-foreground">
                  Select a camera from the list to configure its settings
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Camera Modal Dialog from DeviceActions */}
      <EditDeviceDialog
        device={editingDevice}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingDevice(null);
        }}
        onSave={updateDevice}
      />
    </div>
  );
}
