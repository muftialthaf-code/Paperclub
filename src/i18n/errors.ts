import{isArabic}from'./locale';import{uiArabic}from'./uiArabic';import{t}from'./translate';
export function localizedError(error:unknown){const message=error instanceof Error?error.message:String(error);if(!isArabic())return message;return uiArabic[message]!==undefined?t(message):'ما قدرنا نكمل العملية. شيّكوا البيانات وجرّبوا مرة ثانية.'}
