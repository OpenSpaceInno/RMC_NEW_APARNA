import { useState, useEffect, useCallback } from 'react';
import { PendingDispatch, ApprovalAction, DeliveryDocumentation, RouteAssignment, PlateImage } from '@/types/dispatch';
import { api } from '@/lib/api';

export const useDispatchApproval = () => {
  const [pendingDispatches, setPendingDispatches] = useState<PendingDispatch[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDispatches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getPendingDispatches();
      if (data && Array.isArray(data) && data.length > 0) {
        setPendingDispatches(data);
      }
    } catch (err) {
      console.warn('Pending dispatches API fallback', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize with API data or fallback
  useEffect(() => {
    fetchDispatches();
  }, [fetchDispatches]);

  const approveDispatch = useCallback(async (action: ApprovalAction) => {
    setLoading(true);
    
    setPendingDispatches(prev => 
      prev.map(dispatch => 
        dispatch.id === action.dispatchId
          ? {
              ...dispatch,
              status: action.action === 'approve' ? 'approved' : 'rejected',
              approvedBy: 'OP001',
              approvedAt: new Date().toISOString(),
              rejectionReason: action.reason,
              route: action.route,
            }
          : dispatch
      )
    );

    try {
      if (action.action === 'approve') {
        await api.approveDispatch(action.dispatchId, 'OP001', action.route);
      } else {
        await api.rejectDispatch(action.dispatchId, action.reason || 'Rejected by operator');
      }
    } catch (err) {
      console.warn('API approve/reject fallback', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const assignRoute = useCallback((dispatchId: string, route: RouteAssignment) => {
    setPendingDispatches(prev =>
      prev.map(dispatch =>
        dispatch.id === dispatchId
          ? { ...dispatch, route }
          : dispatch
      )
    );
  }, []);

  const verifyDocument = useCallback((dispatchId: string, docId: string) => {
    setPendingDispatches(prev =>
      prev.map(dispatch =>
        dispatch.id === dispatchId
          ? {
              ...dispatch,
              documentation: dispatch.documentation.map(doc =>
                doc.id === docId ? { ...doc, verified: true } : doc
              ),
            }
          : dispatch
      )
    );
  }, []);

  return {
    pendingDispatches,
    loading,
    approveDispatch,
    assignRoute,
    verifyDocument,
    refetch: fetchDispatches,
  };
};
