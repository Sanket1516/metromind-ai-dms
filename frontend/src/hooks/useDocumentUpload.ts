import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { uploadDocument } from '../services/documents';
import { toast } from 'react-toastify';

export const useDocumentUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation(uploadDocument, {
    onMutate: () => {
      setIsUploading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries('documents');
      toast.success('Document uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  return {
    uploadDocument: mutation.mutate,
    isUploading,
    error: mutation.error,
  };
};
