import { Select } from "@cloudflare/kumo";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
const regionNames = new Intl.DisplayNames(["zh-CN"], { type: "region" });
export const phoneCountries = getCountries()
  .map((value) => ({
    value,
    label: `${regionNames.of(value) ?? value} +${getCountryCallingCode(value)}`,
    callingCode: `+${getCountryCallingCode(value)}`,
  }))
  .sort((a, b) =>
    a.value === "CN"
      ? -1
      : b.value === "CN"
        ? 1
        : a.label.localeCompare(b.label, "zh-CN"),
  );
export function PhoneCountrySelect({
  value,
  onChange,
}: {
  value: CountryCode;
  onChange: (country: CountryCode, callingCode: string) => void;
}) {
  return (
    <Select<CountryCode>
      label="国家或地区区号"
      items={phoneCountries}
      value={value}
      renderValue={(country) =>
        phoneCountries.find((option) => option.value === country)
          ?.callingCode ?? "+86"
      }
      onValueChange={(country) => {
        const option = phoneCountries.find((item) => item.value === country);
        if (option) onChange(option.value, option.callingCode);
      }}
    />
  );
}
