import moment from "moment";

/* eslint-disable @typescript-eslint/no-explicit-any */
const dateFormatter = (date: any) => moment(date).format('MMMM DD, YYYY');
const dateStringFormatter = (date: any) => moment(date).format('MMMM DD, YYYY');
const timeFormatter = (datetimeString:any) => {
  console.log(datetimeString)
  return moment(datetimeString).format('hh:mm A')};

const numericFormat = (num: number) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(num);
};



export {
    dateFormatter,
    timeFormatter,
    dateStringFormatter,
    numericFormat
  };