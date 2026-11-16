import { getStatusFallbackMessage, parseApiError } from '../../../core/http/api-error.util';

export type WorkLocationSubmitAction = 'create' | 'update';

/**
 * Turns any submission failure into one actionable Persian sentence.
 *
 * The backend's ProblemDetails message is preferred. Status-specific copy is
 * only used when the server sent a generic (or missing) message, so real
 * validation errors are never hidden.
 */
export function resolveWorkLocationSubmitError(
  error: unknown,
  action: WorkLocationSubmitAction
): string {
  const info = parseApiError(error);

  if (info.message !== getStatusFallbackMessage(info.status)) {
    return info.message;
  }

  switch (info.status) {
    case 0:
      return 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.';
    case 400:
    case 422:
      return action === 'create'
        ? 'اطلاعات محل کار معتبر نیست. نام، موقعیت و شعاع محدوده را بررسی کنید.'
        : 'اطلاعات محل کار معتبر نیست. تغییرات را بررسی و دوباره ذخیره کنید.';
    case 403:
      return action === 'create'
        ? 'شما اجازهٔ ثبت محل کار برای این مرکز را ندارید.'
        : 'شما اجازهٔ ویرایش این محل کار را ندارید.';
    case 404:
      return action === 'create'
        ? 'مرکز سازمانی مورد نظر یافت نشد. لطفاً دوباره وارد حساب خود شوید.'
        : 'محل کار مورد نظر یافت نشد. ممکن است حذف شده باشد.';
    case 409:
      return 'محل کاری با این نام در این مرکز از قبل ثبت شده است.';
    default:
      return action === 'create'
        ? 'ثبت محل کار انجام نشد. لطفاً دوباره تلاش کنید.'
        : 'ذخیرهٔ تغییرات انجام نشد. لطفاً دوباره تلاش کنید.';
  }
}
