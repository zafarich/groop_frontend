export function prettyPhoneNumber(phoneNumber) {
  return phoneNumber
    .replace(/\D/g, "")
    .replace(/^(\d{3})(\d{2})(\d{3})(\d{2})(\d{2})$/, "+$1 $2 $3 $4 $5");
}

export function prettyMoney(amount) {
  if (amount === null || amount === undefined || amount === "") return "";
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
