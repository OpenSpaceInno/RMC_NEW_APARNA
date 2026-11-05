import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function DatabaseSetup() {
  const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const applyMigration = async () => {
    setStatus('running');
    setMessage('Initializing database...');

    try {
      const result = await api.initDatabase();
      
      if (result.success) {
        setStatus('success');
        setMessage('✅ Database tables created successfully! You can now configure your cameras.');
      } else {
        setStatus('error');
        setMessage(`❌ ${result.message}`);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ Error: ${error.message || 'Failed to initialize database'}`);
      console.error('Migration error:', error);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Database className="h-7 w-7" />
          Database Setup
        </h1>
        <p className="text-muted-foreground mt-1">
          Initialize database tables for device configuration storage
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Apply Database Migration</CardTitle>
          <CardDescription>
            This will create the necessary tables to store camera device configurations and RTSP settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'idle' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Click the button below to initialize the MySQL database and create tables.
              </AlertDescription>
            </Alert>
          )}

          {status === 'running' && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === 'success' && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <h4 className="font-medium text-sm">What will be created:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>MySQL database: <code className="bg-muted px-1 py-0.5 rounded">rmc_gate_system</code></li>
              <li>camera_devices - Store camera information</li>
              <li>device_rtsp_config - Store RTSP streaming settings</li>
              <li>device_network_config - Store network configuration</li>
            </ul>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Make sure MySQL is running on localhost:3306 with the credentials in server/.env
            </AlertDescription>
          </Alert>

          <Button
            onClick={applyMigration}
            disabled={status === 'running'}
            className="w-full"
          >
            {status === 'running' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Initializing Database...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Database Ready
              </>
            ) : (
              <>
                <Database className="h-4 w-4 mr-2" />
                Initialize Database
              </>
            )}
          </Button>

          {status === 'success' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.location.href = '/device-config'}
            >
              Go to Device Configuration
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">What's Next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>After setting up the database:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Navigate to Device Configuration page</li>
            <li>Add your camera devices</li>
            <li>Configure RTSP settings for each camera</li>
            <li>Set up HLS proxy for browser playback (optional)</li>
            <li>Test the live stream</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
