import { LegalDocumentDialog } from "../../../shared/components/LegalDocumentDialog";

export function TermsAgreement() {
  return (
    <p className="w-full text-right text-base text-kumo-subtle">
      登录 / 注册即同意
      <LegalDocumentDialog kind="service" label="《用户服务协议》"/>
      <LegalDocumentDialog kind="privacy" label="《隐私政策》"/>
    </p>
  );
}
