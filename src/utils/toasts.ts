import { toast } from 'react-toastify';

export const errorToast = (message: string | null | undefined) =>
  message &&
  toast.error(message, {
    position: 'bottom-right',
  });

export const successToast = (message: string) =>
  toast.success(message, {
    position: 'bottom-right',
    className: 'bg-lime-100',
  });

export const infoToast = (message: string) =>
  toast.info(message, {
    position: 'bottom-right',
    className: 'bg-lime-100',
  });
