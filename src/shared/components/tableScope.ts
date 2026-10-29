import {createContext} from 'react';
/** Null outside the admin application: shared business pages keep their original table. */
export const TableScopeContext=createContext<string|null>(null);
