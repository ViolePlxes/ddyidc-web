# Customer display-copy boundary check

Run on the VM:

```sh
npx tsc src/shared/utils/customerCopy.ts --target ES2022 --module ES2022 --skipLibCheck --outDir .copy-test
node tests/customer-copy.mjs
```

Checks customer display fields while retaining original ids, option values, URLs, tokens, binary download bodies and the original response object. Admin requests do not use the customer response transform.
