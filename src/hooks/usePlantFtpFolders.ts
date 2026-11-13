import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface PlantFtpFolder {
  value: string;
  label: string;
  folderName: string;
  path: string;
}

const DEFAULT_GATE_FOLDERS: PlantFtpFolder[] = [
  { value: 'entry', label: 'Entry Gate', folderName: 'Entry Gate', path: '/Entry Gate' },
  { value: 'exit', label: 'Exit Gate', folderName: 'Exit Gate', path: '/Exit Gate' },
];

/**
 * Fetches FTP gate folders (Entry Gate, Exit Gate, and any custom subfolders)
 * for a given plant from SFTPGo via the backend API.
 */
export function usePlantFtpFolders(plantId: string, enabled: boolean = true) {
  const [folders, setFolders] = useState<PlantFtpFolder[]>(DEFAULT_GATE_FOLDERS);
  const [plantFolder, setPlantFolder] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!enabled || !plantId || plantId === 'all') return;
    let active = true;
    setLoading(true);

    api
      .getPlantFtpFolders(plantId)
      .then((res) => {
        if (!active) return;
        if (res?.success && Array.isArray(res.folders) && res.folders.length > 0) {
          setFolders(res.folders);
          setPlantFolder(res.plantFolder || '');
        } else {
          setFolders(DEFAULT_GATE_FOLDERS);
        }
      })
      .catch(() => {
        if (active) {
          setFolders(DEFAULT_GATE_FOLDERS);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [plantId, enabled]);

  return { folders, plantFolder, loading };
}

