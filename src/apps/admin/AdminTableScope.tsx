import type {ReactNode} from 'react';
import {TableScopeContext} from '../../shared/components/tableScope';
import {useAdminAuthStore} from '../../shared/stores/staffAuth';
export function AdminTableScope({children}:{children:ReactNode}){const owner=useAdminAuthStore(state=>state.user?.id??'anonymous');return <TableScopeContext.Provider value={owner}>{children}</TableScopeContext.Provider>}
