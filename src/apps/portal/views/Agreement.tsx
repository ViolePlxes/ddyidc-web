import { LayerCard, LinkButton } from "@cloudflare/kumo";
import { useParams } from "react-router-dom";
import legalDocuments from "./legalDocuments.json";

export function AgreementPlaceholder() {
  const { kind } = useParams();
  const document = kind === "privacy" ? legalDocuments.privacy : legalDocuments.service;
  return (
    <main className="min-h-svh bg-kumo-recessed p-4 md:p-8">
      <LayerCard className="mx-auto w-full max-w-3xl">
        <LayerCard.Secondary><h1 className="text-2xl font-semibold text-kumo-strong">{document.title}</h1></LayerCard.Secondary><LayerCard.Primary className="grid gap-6">
        <article aria-label={document.title} className="grid min-w-0 gap-4 break-words text-base leading-relaxed text-kumo-default">
          {document.blocks.map((block, index) => block.type === "heading" ? (
            <h2 key={index} className="mt-2 text-lg font-semibold text-kumo-strong">{block.text}</h2>
          ) : (
            <p key={index} className="whitespace-pre-line">{block.text}</p>
          ))}
        </article>
        <LinkButton href="/login" variant="secondary" className="justify-self-start">返回登录</LinkButton>
      </LayerCard.Primary></LayerCard>
    </main>
  );
}
