# Product ordering hierarchy

The console catalogue uses the existing public APIs; it never calls the admin
group API with customer credentials and does not introduce a second taxonomy.

- `GET /api/v1/products`: all pages are read. Root groups have `parentId=0`;
  secondary groups have a visible root as their parent. A product belongs to a
  secondary group only when both `groupId` and `parentGroupId` match. Group labels
  come from `groups.name`, because the existing product `groupName` projection
  can contain the **root** name. Product names are not classification keys.
- `GET /api/v1/products/:id`: the existing cached details verify a nonzero
  `supplierId` and `upstreamProductId`. Each linked local product is a selectable
  compute specification. No synthetic `ProductSpec` or database rows are created.
- `GET /api/v1/upstream/order-page`: supplies live CPU/memory defaults, resource
  choices, images and cycle prices. The product description is rendered as text
  after removing supplier style/script blocks; it is never injected as HTML.

Empty categories and failed reads keep category switching and refresh/retry
available. Sold-out products cannot be selected. Changing categories immediately
removes the old product configuration/bill; configuration errors never enable a
purchase with missing upstream options.

`ProductConfig` retains the existing cart, order draft and confirmation contracts.
For a linked product without manual specs, `selectedSpec` is null and the unchanged
order service accepts an omitted `specId`. Its existing order-page pricing path
is used. If manual specs exist, their existing selection and `specId` are retained
as a supplemental sales-specification section.

Resource selections are keyed by **option ID**, not field name: a real supplier
can return distinct outbound/inbound options with `field=bandwidth`. Both IDs and
values must reach the existing order snapshot. CPU/memory controls are available
when there is no manual spec to choose those resources. The UI exposes the four
cycles supported by the existing order service (monthly, quarterly, semiannually,
annually); it does not submit unsupported supplier cycles as a one-month order.

No backend contract, order pricing, payment or provisioning rules were changed.
Admin group maintenance remains authoritative. The admin empty manual-spec hint
now explains that linked products can be ordered directly.

## Verification

Run on the local Linux VM:

```
npm ci
npx tsc -b
npm run build
node --test tests/productCatalog.test.mjs
```

Mapping tests cover same-name groups, mismatched parents, empty/hidden groups,
invalid supplier mappings and removal of supplier style/script text. Live
catalogue and browser checks cover the existing ACS2 product with no manual
specs: category selection, CPU/memory, disk/IP, quarterly quantity two, cart and
real unpaid order creation. Configured total is CNY 392.40 in the bill, cart and
server order. Test verification does not pay or provision an upstream resource.
