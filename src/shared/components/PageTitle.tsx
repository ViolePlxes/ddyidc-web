import {useLayoutEffect} from 'react';
import {useLocation} from 'react-router-dom';
import {pageTitle} from '../utils/pageTitle';

/** One shared browser-title policy for all React entry points. */
export function PageTitle(){const {pathname}=useLocation();useLayoutEffect(()=>{document.title=pageTitle(pathname)},[pathname]);return null;}
