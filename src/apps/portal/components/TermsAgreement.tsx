import { Checkbox } from "@cloudflare/kumo";
import { Link } from "react-router-dom";

type TermsAgreementProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
};

export function TermsAgreement({ checked, onCheckedChange }: TermsAgreementProps) {
  return (
    <Checkbox
      required
      checked={checked}
      onCheckedChange={(value) => onCheckedChange(value === true)}
      label={
        <span className="text-sm text-kumo-subtle">
          我已阅读并同意
          <Link className="text-kumo-link hover:underline" to="/terms/service" target="_blank" rel="noreferrer">《服务协议》</Link>
          和
          <Link className="text-kumo-link hover:underline" to="/terms/privacy" target="_blank" rel="noreferrer">《隐私协议》</Link>
        </span>
      }
    />
  );
}
