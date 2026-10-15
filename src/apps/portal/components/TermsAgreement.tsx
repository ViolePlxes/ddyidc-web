import { Link } from "react-router-dom";

export function TermsAgreement() {
  return (
    <p className="w-full text-right text-base text-kumo-subtle">
      登录 / 注册即同意
      <Link className="text-kumo-link hover:underline" to="/terms/service" target="_blank" rel="noreferrer">《用户服务协议》</Link>
      <Link className="text-kumo-link hover:underline" to="/terms/privacy" target="_blank" rel="noreferrer">《隐私政策》</Link>
    </p>
  );
}
