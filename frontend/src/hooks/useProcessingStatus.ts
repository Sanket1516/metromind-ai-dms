import { useQuery, useQueryClient } from 'react-query';
import { checkProcessingStatus, ProcessingProgress } from '../services/processing';

export const useProcessingStatus = (documentId: string, enabled = true) => {
  const queryClient = useQueryClient();

  return useQuery<ProcessingProgress>(
    ['processingStatus', documentId],
    () => checkProcessingStatus(documentId),
    {
      enabled,
      refetchInterval: (data) =>
        data?.status === 'completed' || data?.status === 'error' ? false : 2000,
      onSuccess: (data) => {
        if (data.status === 'completed') {
          // Invalidate document query to refresh with new OCR/AI results
          queryClient.invalidateQueries(['document', documentId]);
        }
      },
    }
  );
};
