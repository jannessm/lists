import { Options } from "flatpickr/dist/types/options";

const _timePickerConfig: Options = {
  enableTime: true,
  minuteIncrement: 5,
  disableMobile: true,
  time_24hr: true,
};

export function getTimePickerConfig(): Options {
  Object.assign(_timePickerConfig, {defaultDate: new Date()});
  return _timePickerConfig;
}