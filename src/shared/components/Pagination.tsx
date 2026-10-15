import { Pagination as KumoPagination } from '@cloudflare/kumo';
import type { ComponentProps } from 'react';

/** Official pagination behavior and styling, with Chinese presentation labels. */
function PaginationRoot(props: ComponentProps<typeof KumoPagination>) {
  const { children, labels, controls, text, ...rootProps } = props;
  const translatedLabels = { navigation: '分页', firstPage: '第一页', previousPage: '上一页', nextPage: '下一页', lastPage: '最后一页', pageNumber: '页码', pageSize: '每页条数', ...labels };
  if (children !== undefined || text !== undefined) return <KumoPagination {...props} labels={translatedLabels} />;
  return <KumoPagination {...rootProps} labels={translatedLabels}>
    {children ?? <>
      <KumoPagination.Info>{({ pageShowingRange, totalCount }) => totalCount === undefined ? `显示 ${pageShowingRange}` : `显示 ${pageShowingRange} 条，共 ${totalCount} 条`}</KumoPagination.Info>
      <KumoPagination.Controls controls={controls} />
    </>}
  </KumoPagination>;
}

export const Pagination = Object.assign(PaginationRoot, {
  Info: KumoPagination.Info,
  PageSize: KumoPagination.PageSize,
  Controls: KumoPagination.Controls,
  Separator: KumoPagination.Separator,
});
