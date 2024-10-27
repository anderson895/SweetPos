/* eslint-disable @typescript-eslint/no-explicit-any */
import { debounce } from 'lodash';
import moment from 'moment';

const executeOnProcess = async (callback: any) =>
  await new Promise((resolve) => {
    callback();
    setTimeout(() => resolve(true), 2000);
  });

const dateFormatter = (date: any) => moment(date).format('MMMM DD, YYYY');
const dateStringFormatter = (date: any) => moment(date).format('MMMM DD, YYYY');
const timeFormatter = (datetimeString:any) => {
  console.log(datetimeString)
  return moment(datetimeString).format('hh:mm A')};

const useDebounce = (func: any) => debounce(func, 1000);

const currencyFormat = (num: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
  });

  return formatter.format(num);
};
const numericFormat = (num: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(num);
};

function calculateAge(birthday:any) {
  const today = new Date();
  const birthDate = new Date(birthday);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

const getFullName = (account:any) => {
  const { lastName, suffix, firstName, middleName } = account;
  return `${lastName}${suffix ? ` ${suffix}` : ""}, ${firstName} ${
    middleName ? `${middleName}` : ""
  }`;
};

const applyDiscount = (item: any) => {
  const currentDate = new Date();
  const discountStart = new Date(item.DISCOUNT_START);
  const discountEnd = new Date(item.DISCOUNT_END);
  if (currentDate >= discountStart && currentDate <= discountEnd) {
      if (item.QUANTITY >= item.PACKS_REQUIRED) {
          return {price:item.UNIT_PRICE - item.TOTAL_DISCOUNT_AMOUNT,isDiscounted:true}
      }
  }
  return {price:item.UNIT_PRICE,isDiscounted:false};
};

export {
  currencyFormat,
  dateFormatter,
  executeOnProcess,
  useDebounce,
  timeFormatter,
  dateStringFormatter,
  numericFormat,
  calculateAge,
  getFullName,
  applyDiscount
};
