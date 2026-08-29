import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Bell, LogOut, Settings, User, Mail, Plus, Search, Home, Users, Compass, HelpCircle, Calendar, ChevronRight, Copy, Download, Check, Menu, X } from 'lucide-react';
import { apiUrl, fetchApi, resolveImageUrl } from '@/lib/apiBase';
import { getEventPath, getOrganizationPath } from '@/lib/eventUrl';
import { acquireDocumentScrollLock } from '@/lib/documentScrollLock';
import fauvesBrandSvg from '@/assets/fauves-logotipo-brand.svg?raw';

/* ─── LUMA DESIGN TOKENS ────────────────────────────────────────────────── */
const luma = {
  font: `Inter, -apple-system, BlinkMacSystemFont, "Apple Color Emoji", Roboto, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
  black: '#131517',
  gray10: '#f7f8f9',
  gray20: '#ebeced',
  gray30: '#dee0e2',
  gray60: '#939597',
  purple40: '#7b49ff',
  whiteThickTranslucent: 'rgba(255,255,255,.867)',
  whiteTranslucent: 'rgba(255,255,255,.533)',
  backdropBlur: 'blur(16px)',
};

/* ─── SVGS ORIGINAIS ────────────────────────────────────────────────────── */
const FauvesLogo = ({ isDark }: { isDark: boolean }) => {
  const maskId = React.useId().replace(/:/g, '');

  return (
    <svg
      className={`header-fauves-logo ${isDark ? 'is-dark' : 'is-light'}`}
      width="54"
      viewBox="60 280 480 250"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id={maskId} x="50" y="275" width="500" height="260" maskUnits="userSpaceOnUse" style={{ maskType: 'luminance' }}>
          <path fill="white" d="M502.9,313.4l-230.5,43.7-206.9-20.1-9.2,150.4,74.3,41.1,233.2-48.1,154.3-2.1,20.9-41.3-36.1-123.6Z" />

          <g className="fauves-logo-cut fauves-logo-cut-f">
            <path fill="black" d="M93.8,381.6c0-.3.1-.9,1.4-1,5.6-.7,25.8-3.4,33.2-4.4,9.6-1.3,38.2-5.1,38.2-5.1l1.6,20.8-71,14.5-3.4-24.8Z" />
            <path fill="black" d="M138.5,474.1l-33,6.2c-1.7-14.7-4.1-37.9-6.3-59,0,0,57-8.3,64.9-9.9.9,4.4,1.2,12.5,1.2,12.5-15.8,3.9-16.6,4.2-29.3,6.4,1.8,15.1,2.6,26.1,4.4,41.3.1,1.2-.7,2.3-1.9,2.4Z" />
          </g>
          <path className="fauves-logo-cut fauves-logo-cut-a" fill="black" d="M219.1,476.9c-.9.1-1.8-.5-2-1.4-2.7-10.6-12.1-41-12.1-41-6.4-.1-10.7,0-17.3.1-1.2,7.1-3.5,20-5.4,30.3l-18.2,3.7c5.3-24.5,12.6-56.8,17.7-80.2.1-.5.8-2.1,3.9-2l29.8.7c3.3,10.1,6.5,20.2,9.8,30.2,4.8,14.6,14,40.3,18.8,54.9l-25,4.7Z" />
          <path className="fauves-logo-cut fauves-logo-cut-u" fill="black" d="M282.2,460.9c-32.8,6.6-34.7-20.4-37.6-35.6-2-10.5-7.3-37.6-7.3-37.6,0,0,16.2.5,17.2.5,1,0,1.8.7,2,1.6.7,3.6,3.1,16.8,6,31.8,3.6,19.1,6.9,27.8,17.9,25.8,12.9-2.3,11.2-12.9,8.6-30-1.4-9-3.3-19.6-4.6-26.8l-1.5-8.3,15.5-4.4,13.2,68s-10.8,11.2-29.3,14.9Z" />
          <path className="fauves-logo-cut fauves-logo-cut-v" fill="black" d="M351.4,457.3l-19.9,1.8s-17-76.2-19-85.3l10.4-3c.9,0,1.6.7,1.7,1.6.2,1.6,13.1,64.7,13.2,65.1,0-.4,11.1-63,11.3-64.6,0-.9.8-1.6,1.7-1.6l16.7-1.7c-1.6,9.2-16.2,87.8-16.2,87.8Z" />
          <g className="fauves-logo-cut fauves-logo-cut-e">
            <path fill="black" d="M377.9,368.2c15.6-1.1,36.6-3.6,52.8-4.8l-1.4,15c-.1.7-.7,1.8-2.7,2.3l-48.7,11.6c-.3-10.6,0-22.9,0-24.1Z" />
            <path fill="black" d="M425,398.8l1.2,18.4-45,3-1.2-18.4,45-3Z" />
            <path fill="black" d="M380.5,455s-.2-9.6-.5-24.1c0,0,45.6,2.3,53.3,1.5,1,0,1.8.8,2,2.1l1.8,14.9c-16.7,1.6-39.1,3.8-56.5,5.5Z" />
          </g>
          <path className="fauves-logo-cut fauves-logo-cut-s" fill="black" d="M474.7,461.5l-22.9-15.5c11-13.3,17-23.6,9.7-30.1-18.2-16.5-19.2-23.1-19.5-32.2-.6-20.6,17.5-35.3,17.5-35.3l21.2,8.1c.4.2,1.4.7.3,1.7h0c-23.6,21.1-10.8,34.6-10.8,34.6,13,14.4,20.6,14.1,20.6,29.1s-14.1,37-16.2,39.5Z" />
        </mask>
      </defs>

      <path
        className="fauves-logo-shape"
        fill="currentColor"
        mask={`url(#${maskId})`}
        d="M502.9,313.4l-230.5,43.7-206.9-20.1-9.2,150.4,74.3,41.1,233.2-48.1,154.3-2.1,20.9-41.3-36.1-123.6Z"
      />
    </svg>
  );
};

const LumaSparkle = () => (
  <svg width="24" height="24" viewBox="0 0 133 134" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M133 67C96.282 67 66.5 36.994 66.5 0c0 36.994-29.782 67-66.5 67 36.718 0 66.5 30.006 66.5 67 0-36.994 29.782-67 66.5-67"></path>
  </svg>
);

const EventosIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M3.204 1.25C1.44 1.25 0.251 2.938 0.251 4.692V6.146C0.25 6.214 0.25 6.309 0.258 6.393C0.270483 6.55979 0.326327 6.72043 0.42 6.859C0.562 7.064 0.768 7.157 0.831 7.186L0.836 7.188C0.919 7.226 1.021 7.264 1.113 7.298L1.129 7.305C1.306 7.371 1.523 7.614 1.523 8.001C1.523 8.388 1.306 8.631 1.129 8.697L1.112 8.704C1.021 8.738 0.919 8.776 0.836 8.814L0.831 8.816C0.768 8.845 0.562 8.938 0.42 9.143C0.32649 9.28128 0.270654 9.44155 0.258 9.608C0.25 9.692 0.25 9.788 0.25 9.855V11.308C0.25 13.063 1.438 14.751 3.204 14.751H12.796C14.562 14.751 15.75 13.063 15.75 11.308V9.854C15.75 9.786 15.75 9.691 15.742 9.607C15.7293 9.44055 15.6735 9.28028 15.58 9.142C15.438 8.937 15.232 8.844 15.169 8.815L15.164 8.812C15.0731 8.77261 14.9811 8.73592 14.888 8.702L14.871 8.696C14.694 8.63 14.477 8.387 14.477 8C14.477 7.613 14.694 7.37 14.871 7.304L14.888 7.297C14.979 7.263 15.081 7.225 15.164 7.187L15.169 7.185C15.3327 7.11457 15.4746 7.00167 15.58 6.858C15.6737 6.71943 15.7295 6.55879 15.742 6.392C15.75 6.308 15.75 6.213 15.75 6.145V4.693C15.75 2.938 14.56 1.25 12.796 1.25H3.204ZM1.751 4.693C1.751 3.472 2.535 2.75 3.204 2.75H9.25V5.758C9.25 5.95691 9.32902 6.14768 9.46967 6.28833C9.61032 6.42898 9.80109 6.508 10 6.508C10.1989 6.508 10.3897 6.42898 10.5303 6.28833C10.671 6.14768 10.75 5.95691 10.75 5.758V2.75H12.796C13.465 2.75 14.249 3.472 14.249 4.693V5.937C13.461 6.281 12.977 7.115 12.977 8C12.977 8.885 13.461 9.72 14.25 10.063V11.307C14.25 12.528 13.466 13.25 12.796 13.25H10.75V10.758C10.75 10.5591 10.671 10.3683 10.5303 10.2277C10.3897 10.087 10.1989 10.008 10 10.008C9.80109 10.008 9.61032 10.087 9.46967 10.2277C9.32902 10.3683 9.25 10.5591 9.25 10.758V13.25H3.204C2.534 13.25 1.75 12.528 1.75 11.307V10.063C2.54 9.719 3.023 8.885 3.023 8C3.023 7.115 2.539 6.28 1.75 5.937L1.751 4.693Z" fill="currentColor" fill-opacity="0.360784" />
  </svg>
);

const OrganizacoesIcon = () => (
  <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M5.25 0.75C5.25 0.551088 5.17098 0.360322 5.03033 0.21967C4.88968 0.0790177 4.69891 0 4.5 0C4.30109 0 4.11032 0.0790177 3.96967 0.21967C3.82902 0.360322 3.75 0.551088 3.75 0.75V1.573L3.358 1.617C2.458 1.738 1.7 1.997 1.098 2.599C0.496 3.201 0.237 3.959 0.116 4.859C0 5.725 0 6.828 0 8.195V8.305L0.117 11.642C0.238 12.542 0.497 13.3 1.099 13.902C1.701 14.504 2.459 14.763 3.359 14.884C4.226 15.001 5.328 15.001 6.696 15.001H8.354L11.691 14.884C12.591 14.763 13.349 14.504 13.951 13.902C14.553 13.3 14.812 12.542 14.933 11.642C15.05 10.775 15.05 9.673 15.05 8.305V8.195L14.933 4.858C14.812 3.958 14.553 3.2 13.951 2.598C13.349 1.996 12.591 1.737 11.691 1.616L11.251 1.568V0.75C11.251 0.551088 11.172 0.360322 11.0313 0.21967C10.8907 0.0790177 10.6999 0 10.501 0C10.3021 0 10.1113 0.0790177 9.97067 0.21967C9.83002 0.360322 9.751 0.551088 9.751 0.75V1.506L8.353 1.5H6.695C6.175 1.49867 5.69333 1.50067 5.25 1.506V0.75ZM9.75 3.75V3.006L8.298 3H6.75L5.25 3.007V3.75C5.25 3.94891 5.17098 4.13968 5.03033 4.28033C4.88968 4.42098 4.69891 4.5 4.5 4.5C4.30109 4.5 4.11032 4.42098 3.96967 4.28033C3.82902 4.13968 3.75 3.94891 3.75 3.75V3.08L3.558 3.103C2.824 3.202 2.436 3.382 2.159 3.659C1.882 3.936 1.702 4.324 1.603 5.058C1.502 5.813 1.5 6.815 1.5 8.25L1.603 11.442C1.702 12.176 1.882 12.564 2.159 12.841C2.436 13.118 2.824 13.298 3.558 13.397C4.313 13.498 5.314 13.5 6.75 13.5H8.298L11.49 13.397C12.224 13.298 12.612 13.118 12.889 12.841C13.166 12.564 13.346 12.176 13.445 11.442C13.547 10.687 13.548 9.685 13.548 8.25L13.445 5.058C13.346 4.324 13.166 3.936 12.889 3.659C12.612 3.382 12.224 3.202 11.49 3.103L11.249 3.075V3.75C11.249 3.94891 11.17 4.13968 11.0293 4.28033C10.8887 4.42098 10.6979 4.5 10.499 4.5C10.3001 4.5 10.1093 4.42098 9.96867 4.28033C9.82802 4.13968 9.749 3.94891 9.749 3.75H9.75ZM4.75 7.25C4.75 7.44891 4.67098 7.63968 4.53033 7.78033C4.38968 7.92098 4.19891 8 4 8C3.80109 8 3.61032 7.92098 3.46967 7.78033C3.32902 7.63968 3.25 7.44891 3.25 7.25C3.25 7.05109 3.32902 6.86032 3.46967 6.71967C3.61032 6.57902 3.80109 6.5 4 6.5C4.19891 6.5 4.38968 6.57902 4.53033 6.71967C4.67098 6.86032 4.75 7.05109 4.75 7.25ZM4.75 10.75C4.75 10.9489 4.67098 11.1397 4.53033 11.2803C4.38968 11.421 4.19891 11.5 4 11.5C3.80109 11.5 3.61032 11.421 3.46967 11.2803C3.32902 11.1397 3.25 10.9489 3.25 10.75C3.25 10.5511 3.32902 10.3603 3.46967 10.2197C3.61032 10.079 3.80109 10 4 10C4.19891 10 4.38968 10.079 4.53033 10.2197C4.67098 10.3603 4.75 10.5511 4.75 10.75ZM7.5 8C7.69891 8 7.88968 7.92098 8.03033 7.78033C8.17098 7.63968 8.25 7.44891 8.25 7.25C8.25 7.05109 8.17098 6.86032 8.03033 6.71967C7.88968 6.57902 7.69891 6.5 7.5 6.5C7.30109 6.5 7.11032 6.57902 6.96967 6.71967C6.82902 6.86032 6.75 7.05109 6.75 7.25C6.75 7.44891 6.82902 7.63968 6.96967 7.78033C7.11032 7.92098 7.30109 8 7.5 8ZM8.25 10.75C8.25 10.9489 8.17098 11.1397 8.03033 11.2803C7.88968 11.421 7.69891 11.5 7.5 11.5C7.30109 11.5 7.11032 11.421 6.96967 11.2803C6.82902 11.1397 6.75 10.9489 6.75 10.75C6.75 10.5511 6.82902 10.3603 6.96967 10.2197C7.11032 10.079 7.30109 10 7.5 10C7.69891 10 7.88968 10.079 8.03033 10.2197C8.17098 10.3603 8.25 10.5511 8.25 10.75ZM11 8C11.1989 8 11.3897 7.92098 11.5303 7.78033C11.671 7.63968 11.75 7.44891 11.75 7.25C11.75 7.05109 11.671 6.86032 11.5303 6.71967C11.3897 6.57902 11.1989 6.5 11 6.5C10.8011 6.5 10.6103 6.57902 10.4697 6.71967C10.329 6.86032 10.25 7.05109 10.25 7.25C10.25 7.44891 10.329 7.63968 10.4697 7.78033C10.6103 7.92098 10.8011 8 11 8ZM11.75 10.75C11.75 10.9489 11.671 11.1397 11.5303 11.2803C11.3897 11.421 11.1989 11.5 11 11.5C10.8011 11.5 10.6103 11.421 10.4697 11.2803C10.329 11.1397 10.25 10.9489 10.25 10.75C10.25 10.5511 10.329 10.3603 10.4697 10.2197C10.6103 10.079 10.8011 10 11 10C11.1989 10 11.3897 10.079 11.5303 10.2197C11.671 10.3603 11.75 10.5511 11.75 10.75Z" fill="currentColor" fill-opacity="0.360784" />
  </svg>
);

const DescobrirIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M1.5005 7.497C1.5005 6.7094 1.65563 5.92951 1.95703 5.20186C2.25844 4.47421 2.70021 3.81305 3.25713 3.25613C3.81405 2.69921 4.47521 2.25744 5.20286 1.95603C5.93051 1.65463 6.7104 1.4995 7.498 1.4995C8.2856 1.4995 9.06549 1.65463 9.79314 1.95603C10.5208 2.25744 11.182 2.69921 11.7389 3.25613C12.2958 3.81305 12.7376 4.47421 13.039 5.20186C13.3404 5.92951 13.4955 6.7094 13.4955 7.497C13.4955 9.08764 12.8636 10.6131 11.7389 11.7379C10.6141 12.8626 9.08864 13.4945 7.498 13.4945C5.90736 13.4945 4.38188 12.8626 3.25713 11.7379C2.13238 10.6131 1.5005 9.08764 1.5005 7.497ZM7.4975 0C6.51291 -1.46715e-08 5.53797 0.193929 4.62833 0.570713C3.71869 0.947498 2.89217 1.49976 2.19597 2.19597C1.49976 2.89217 0.947498 3.71869 0.570713 4.62833C0.193929 5.53797 0 6.51291 0 7.4975C0 8.48209 0.193929 9.45703 0.570713 10.3667C0.947498 11.2763 1.49976 12.1028 2.19597 12.799C2.89217 13.4952 3.71869 14.0475 4.62833 14.4243C5.53797 14.8011 6.51291 14.995 7.4975 14.995C9.48596 14.995 11.393 14.2051 12.799 12.799C14.2051 11.393 14.995 9.48596 14.995 7.4975C14.995 5.50904 14.2051 3.60202 12.799 2.19597C11.393 0.789913 9.48596 2.96304e-08 7.4975 0ZM10.8205 5.084C10.8521 4.95827 10.8505 4.82651 10.8159 4.70157C10.7814 4.57663 10.715 4.46277 10.6234 4.37111C10.5317 4.27945 10.4179 4.21311 10.2929 4.17857C10.168 4.14402 10.0362 4.14245 9.9105 4.174L6.3625 5.062C5.7225 5.222 5.2225 5.722 5.0625 6.362L4.1745 9.911C4.14295 10.0367 4.14452 10.1685 4.17907 10.2934C4.21361 10.4184 4.27995 10.5322 4.37161 10.6239C4.46327 10.7155 4.57713 10.7819 4.70207 10.8164C4.82701 10.851 4.95877 10.8526 5.0845 10.821L8.6325 9.933C9.2725 9.773 9.7725 9.273 9.9325 8.633L10.8205 5.084ZM6.7265 6.517L9.0615 5.933L8.4785 8.268C8.46567 8.31868 8.43939 8.36496 8.40242 8.40192C8.36545 8.43889 8.31918 8.46518 8.2685 8.478L5.9335 9.062L6.5175 6.726C6.53032 6.67532 6.55661 6.62905 6.59358 6.59208C6.63055 6.55511 6.67682 6.52882 6.7275 6.516" fill="currentColor" fill-opacity="0.360784" />
  </svg>
);

const SearchIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

/* ─── NOTIFICATION MENU (ORIGINAL) ──────────────────────────────────────── */
const NotificationMenu = ({ isOpen, isDark, onClose }: { isOpen: boolean, isDark: boolean, onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="lux-menu-wrapper"
            style={{ position: 'absolute', top: '48px', right: '-10px', width: '320px', zIndex: 1001, transformOrigin: 'top right' }}
          >
            <div className="lux-menu-arrow arrow-up" style={{ right: '20px' }} />
            <div className="notification-container" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
              <div className="empty-state">
                <div className="moon-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.2 }}>
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                </div>
                <h3 style={{ margin: '1rem 0 0.5rem', fontSize: '1.125rem', fontWeight: 600, color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(19,21,23,.4)' }}>Está Silencioso Aqui</h3>
                <p style={{ fontSize: '0.9375rem', color: isDark ? 'rgba(255,255,255,.4)' : 'rgba(19,21,23,.3)', lineHeight: 1.4 }}>Crie um evento e convide alguns amigos.</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ─── PROFILE MENU (ORIGINAL) ─────────────────────────────────────────── */
const ProfileMenu = ({ isOpen, user, isDark, onClose, logout }: { isOpen: boolean, user: any, isDark: boolean, onClose: () => void, logout: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000 }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="lux-menu-wrapper"
            style={{ position: 'absolute', top: '48px', right: '-8px', width: '260px', zIndex: 1001, transformOrigin: 'top right' }}
          >
            <div className="lux-menu-arrow arrow-up" style={{ right: '16px' }} />
            <div className="lux-menu-content" style={{ padding: '8px 0' }}>
              <Link to={`/u/${user?.id}`} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', background: '#ebeced', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {user?.photoUrl ? <img src={user.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontWeight: 600, color: '#939597' }}>{user?.name?.[0]}</span>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: isDark ? '#ffffff' : '#131517', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                  <div style={{ fontSize: '13px', color: isDark ? 'rgba(255,255,255,.5)' : 'rgba(19,21,23,.4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                </div>
              </Link>
              <div style={{ height: '1px', background: isDark ? 'rgba(255,255,255,.1)' : 'rgba(19,21,23,.06)', margin: '4px 0' }} />
              <div style={{ padding: '0 4px' }}>
                <Link to={`/u/${user?.id}`} onClick={onClose} className="menu-action-row">Ver Perfil</Link>
                <Link to="/v2/account-settings" onClick={onClose} className="menu-action-row">Configurações</Link>
                <div onClick={() => { logout(); onClose(); }} className="menu-action-row" style={{ cursor: 'pointer' }}>Sair</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/* ─── SEARCH MODAL (ORIGINAL) ──────────────────────────────────────────── */
/* ─── SEARCH MODAL (ENHANCED) ────────────────────────────────────────── */
const SearchModal = ({ isOpen, isDark, onClose }: { isOpen: boolean, isDark: boolean, onClose: () => void }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [orgs, setOrgs] = useState<any[]>([]);
  const [organizing, setOrganizing] = useState<any[]>([]);
  const [participating, setParticipating] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    events: any[];
    collections: any[];
    organizations: any[];
    users: any[];
  }>({ events: [], collections: [], organizations: [], users: [] });

  useEffect(() => {
    if (isOpen && user) {
      loadData();
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSearchResults({ events: [], collections: [], organizations: [], users: [] });
      setSearchLoading(false);
      return;
    }

    const term = query.trim();
    if (term.length < 2) {
      setSearchResults({ events: [], collections: [], organizations: [], users: [] });
      setSearchLoading(false);
      return;
    }

    setSearchResults({ events: [], collections: [], organizations: [], users: [] });
    setSearchLoading(true);
    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setSearchLoading(true);
      try {
        const normalizedTerm = term
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toLowerCase();
        const response = await fetchApi(
          `/api/search?term=${encodeURIComponent(term)}&term_norm=${encodeURIComponent(normalizedTerm)}`,
        );
        if (!response.ok) throw new Error(`Busca indisponível (${response.status})`);
        const data = await response.json();
        if (active) {
          setSearchResults({
            events: Array.isArray(data?.events) ? data.events : [],
            collections: Array.isArray(data?.collections) ? data.collections : [],
            organizations: Array.isArray(data?.organizations) ? data.organizations : [],
            users: Array.isArray(data?.users) ? data.users : [],
          });
        }
      } catch (error) {
        console.error('SearchModal search error:', error);
        if (active) setSearchResults({ events: [], collections: [], organizations: [], users: [] });
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [isOpen, query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Triggered by Header anyway, but good for local handling
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const loadData = async () => {
    if (!user) return;
    setInitialLoading(true);
    try {
      const [orgsRes, organizingRes, participatingRes] = await Promise.all([
        fetchApi('/api/organization/list'),
        fetchApi(`/api/events/by-user?userId=${user.id}`),
        fetchApi('/api/my/tickets')
      ]);

      const orgsData = await orgsRes.json();
      const organizingData = await organizingRes.json();
      const participatingData = await participatingRes.json();

      if (Array.isArray(orgsData)) setOrgs(orgsData);
      if (Array.isArray(organizingData)) setOrganizing(organizingData);
      if (participatingData?.items && Array.isArray(participatingData.items)) {
        // Group by event to show unique events
        const uniqueEvents: any[] = [];
        const seenIds = new Set();
        participatingData.items.forEach((t: any) => {
          if (!seenIds.has(t.eventId)) {
            seenIds.add(t.eventId);
            uniqueEvents.push(t);
          }
        });
        setParticipating(uniqueEvents);
      }
    } catch (e) {
      console.error('SearchModal data fetch error:', e);
    } finally {
      setInitialLoading(false);
    }
  };

  const normalizedQuery = query
    .trim()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  const matchesQuery = (...values: unknown[]) => values.some((value) => (
    typeof value === 'string'
    && value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().includes(normalizedQuery)
  ));

  const ownEventResults = normalizedQuery.length >= 2
    ? organizing.filter((event) => matchesQuery(event.name, event.locationCity, event.locationUf))
    : [];
  const participatingResults = normalizedQuery.length >= 2
    ? participating.filter((ticket) => matchesQuery(ticket.eventName))
    : [];
  const ownCalendarResults = normalizedQuery.length >= 2
    ? orgs.filter((org) => matchesQuery(org.name, org.description, org.bio))
    : [];

  const publicEventIds = new Set(searchResults.events.map((event) => event.id));
  const matchedEvents = [
    ...ownEventResults.map((event) => ({ ...event, isManagedByUser: true })),
    ...participatingResults
      .filter((ticket) => !publicEventIds.has(ticket.eventId))
      .map((ticket) => ({
        id: ticket.eventId,
        slug: ticket.eventSlug,
        name: ticket.eventName,
        startDate: ticket.eventStartDate,
        image: ticket.eventBannerUrl,
      })),
    ...searchResults.events.filter((event) => !ownEventResults.some((ownEvent) => ownEvent.id === event.id)),
  ].slice(0, 8);

  const matchedOrganizations = [
    ...ownCalendarResults,
    ...searchResults.organizations.filter((organization) => (
      !ownCalendarResults.some((ownOrganization) => ownOrganization.id === organization.id)
    )),
  ].slice(0, 8);

  const hasSearchResults = matchedEvents.length > 0
    || matchedOrganizations.length > 0
    || searchResults.collections.length > 0
    || searchResults.users.length > 0;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    return `${date.getDate()} de ${months[date.getMonth()]}. de ${date.getFullYear()}, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <div style={{ padding: '0.75rem 1rem 0.5rem', fontSize: '12px', fontWeight: 600, color: '#939597', textTransform: 'capitalize' }}>
      {title}
    </div>
  );

  const ListItem = ({ icon, label, sublabel, image, color, to, onClick }: any) => (
    <Link 
      to={to || '#'} 
      onClick={onClick || onClose}
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.75rem', 
        padding: '0.625rem 1rem', 
        textDecoration: 'none',
        color: isDark ? '#ffffff' : '#131517',
        borderRadius: '8px',
        margin: '0 0.5rem',
        transition: 'background 0.2s'
      }}
      className="search-list-item"
    >
      <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: image || color ? '50%' : '6px', 
        background: color || (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'hidden'
      }}>
        {image ? (
          <img src={resolveImageUrl(image)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          icon || null
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.9375rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
        {sublabel && <div style={{ fontSize: '0.75rem', color: '#939597' }}>{sublabel}</div>}
      </div>
      {to && to.startsWith('http') && <ChevronRight size={14} color="#dee0e2" />}
    </Link>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 2000 }}
          />
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 2001, pointerEvents: 'none', paddingTop: '10vh' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              style={{ 
                width: '100%', 
                maxWidth: '580px', 
                background: isDark ? '#1c1c1e' : '#fff', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.2)', 
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '80vh',
                color: isDark ? '#ffffff' : '#131517'
              }}
            >
              <div style={{ padding: '0.75rem 1rem', borderBottom: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(19,21,23,.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Search size={20} color="#939597" />
                <input 
                  autoFocus 
                  placeholder="Buscar eventos, pessoas ou calendários..." 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent' }} 
                />
              </div>

              <div style={{ overflowY: 'auto', paddingBottom: '1rem' }} className="custom-scrollbar">
                {!query ? (
                  <>
                    <SectionHeader title="Atalhos" />
                    <ListItem 
                      icon={<Plus size={18} />} 
                      label="Criar Evento" 
                      to="/create" 
                      className="shortcut-item highlighted"
                    />
                    <ListItem icon={<Home size={18} />} label="Página Inicial" to="/" />
                    <ListItem icon={<Users size={18} />} label="Abrir Calendários" to="/organizations" />
                    <ListItem icon={<Compass size={18} />} label="Abrir Descobrir" to="/discover" />
                    <ListItem icon={<HelpCircle size={18} />} label="Abrir Ajuda" to="https://help.fauves.com.br" />

                    {initialLoading && orgs.length === 0 && organizing.length === 0 && participating.length === 0 && (
                      <div style={{ padding: '0.75rem 1rem', color: '#939597', fontSize: '0.75rem' }}>
                        Carregando seus eventos e calendários...
                      </div>
                    )}

                    {orgs.length > 0 && (
                      <>
                        <SectionHeader title="Calendários" />
                        {orgs.slice(0, 5).map(org => (
                          <ListItem 
                            key={org.id}
                            image={org.logoUrl}
                            label={org.name}
                            to={`/${org.slug || org.id}`}
                          />
                        ))}
                      </>
                    )}

                    {organizing.length > 0 && (
                      <>
                        <SectionHeader title="Organizando" />
                        {organizing.slice(0, 5).map(event => (
                          <ListItem 
                            key={event.id}
                            icon={<Calendar size={16} />}
                            label={event.name}
                            sublabel={formatDate(event.startDate)}
                            to={`/event/manage/${event.id}`}
                          />
                        ))}
                      </>
                    )}

                    {participating.length > 0 && (
                      <>
                        <SectionHeader title="Participando" />
                        {participating.slice(0, 5).map(ticket => (
                          <ListItem 
                            key={ticket.id}
                            icon={<Calendar size={16} />}
                            label={ticket.eventName}
                            sublabel={formatDate(ticket.eventStartDate)}
                            to={`/eventos/${ticket.eventSlug || ticket.eventId}`}
                          />
                        ))}
                      </>
                    )}
                  </>
                ) : query.trim().length < 2 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#939597' }}>
                    Digite pelo menos 2 caracteres para buscar.
                  </div>
                ) : searchLoading && !hasSearchResults ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#939597' }}>
                    Buscando...
                  </div>
                ) : hasSearchResults ? (
                  <>
                    {matchedEvents.length > 0 && (
                      <>
                        <SectionHeader title="Eventos" />
                        {matchedEvents.map((event) => (
                          <ListItem
                            key={`event-${event.id}`}
                            image={event.image || event.bannerUrl}
                            icon={<Calendar size={16} />}
                            label={event.name}
                            sublabel={formatDate(event.startDate)}
                            to={event.isManagedByUser ? `/event/manage/${event.id}` : getEventPath(event)}
                          />
                        ))}
                      </>
                    )}

                    {matchedOrganizations.length > 0 && (
                      <>
                        <SectionHeader title="Calendários" />
                        {matchedOrganizations.map((organization) => (
                          <ListItem
                            key={`organization-${organization.id}`}
                            image={organization.logoUrl}
                            icon={<Users size={16} />}
                            label={organization.name}
                            sublabel={organization.description || organization.bio}
                            to={getOrganizationPath(organization)}
                          />
                        ))}
                      </>
                    )}

                    {searchResults.users.length > 0 && (
                      <>
                        <SectionHeader title="Pessoas" />
                        {searchResults.users.slice(0, 5).map((person) => (
                          <ListItem
                            key={`person-${person.id}`}
                            image={person.photoUrl}
                            icon={<User size={16} />}
                            label={[person.name, person.surname].filter(Boolean).join(' ') || person.username || 'Usuário'}
                            sublabel={person.username ? `@${person.username}` : person.bio}
                            to={`/u/${person.id}`}
                          />
                        ))}
                      </>
                    )}

                    {searchResults.collections.length > 0 && (
                      <>
                        <SectionHeader title="Coleções" />
                        {searchResults.collections.slice(0, 5).map((collection) => (
                          <ListItem
                            key={`collection-${collection.id}`}
                            image={collection.bannerImage}
                            icon={<Calendar size={16} />}
                            label={collection.title}
                            to={`/colecao/${collection.slug || collection.id}`}
                          />
                        ))}
                      </>
                    )}

                    {searchLoading && (
                      <div style={{ padding: '0.75rem 1rem', color: '#939597', fontSize: '0.75rem' }}>
                        Atualizando resultados...
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#939597' }}>
                    Nenhum resultado encontrado para "{query.trim()}".
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <style>{`
            .search-list-item, .search-list-item *, input, div {
              font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            }
            .search-list-item:hover { background: rgba(0,0,0,0.04) !important; }
            .search-list-item.highlighted { background: rgba(0,0,0,0.04); }
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
          `}</style>
        </>
      )}
    </AnimatePresence>
  );
};

/* ─── MAIN HEADER COMPONENT ─────────────────────────────────────────────── */
interface HeaderV2Props {
  transparent?: boolean;
  fixed?: boolean;
  theme?: 'light' | 'dark';
  actionButtonText?: string;
  actionButtonLink?: string;
  explorarLink?: string;
  explorarText?: string;
  scrollTransition?: boolean;
  contentMaxWidth?: string;
  blueGlow?: boolean;
}

const HeaderV2: React.FC<HeaderV2Props> = ({
  transparent = false,
  fixed = false,
  theme,
  actionButtonText = 'Entrar',
  actionButtonLink = '/login',
  explorarLink = '/discover',
  explorarText = 'Explorar',
  scrollTransition = true,
  contentMaxWidth,
  blueGlow = true,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoMenuOpen, setIsLogoMenuOpen] = useState(false);
  const [logoCopyState, setLogoCopyState] = useState<'idle' | 'copied' | 'error'>('idle');
  const [isScrolled, setIsScrolled] = useState(false);
  const [measuredContentLeft, setMeasuredContentLeft] = useState<number | null>(null);
  const navRef = useRef<HTMLElement>(null);

  // Detecta a classe 'dark' no <html> (gerenciada pelo ThemeContext)
  const [systemIsDark, setSystemIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );
  // Transparent headers no longer imply a dark page. Pages rendered over dark
  // artwork can still opt in explicitly with theme="dark".
  const currentTheme = theme ?? (systemIsDark ? 'dark' : 'light');
  const isDarkTheme = currentTheme === 'dark';
  const contentColor = isDarkTheme ? '#fff' : '#131517';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const observer = new MutationObserver(() => {
      setSystemIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Uma única fonte de verdade para alinhar o menu ao conteúdo da página.
  // Páginas podem definir --page-max-width; contentMaxWidth fica disponível
  // apenas para casos em que o header precisa declarar a largura diretamente.
  const resolvedMaxWidth = contentMaxWidth || 'var(--page-max-width, 1200px)';
  const isLoggedIn = !!user;

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const releaseScrollLock = acquireDocumentScrollLock();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      releaseScrollLock();
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isLogoMenuOpen) setLogoCopyState('idle');
  }, [isLogoMenuOpen]);

  useEffect(() => {
    if (!isLogoMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsLogoMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isLogoMenuOpen]);

  const handleLogoContextMenu = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setIsLogoMenuOpen(true);
  };

  const copyBrandSvg = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fauvesBrandSvg.trim());
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fauvesBrandSvg.trim();
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setLogoCopyState('copied');
      window.setTimeout(() => setIsLogoMenuOpen(false), 900);
    } catch {
      setLogoCopyState('error');
    }
  };

  const downloadBrandAssets = () => {
    const blob = new Blob([fauvesBrandSvg.trim()], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = 'fauves-logotipo.svg';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setIsLogoMenuOpen(false);
  };

  useEffect(() => {
    const pageRoot = navRef.current?.parentElement;
    if (!pageRoot || !blueGlow) return;
    pageRoot.classList.add('header-blue-page');
    pageRoot.classList.toggle('header-blue-page-dark', isDarkTheme);
    pageRoot.classList.toggle('header-blue-page-light', !isDarkTheme);
    return () => {
      pageRoot.classList.remove('header-blue-page', 'header-blue-page-dark', 'header-blue-page-light');
    };
  }, [blueGlow, isDarkTheme]);

  useLayoutEffect(() => {
    let frame = 0;
    let observer: ResizeObserver | undefined;

    const measure = () => {
      const anchor = document.querySelector<HTMLElement>('[data-header-align], main');
      if (!anchor) {
        setMeasuredContentLeft(null);
        return;
      }

      const rect = anchor.getBoundingClientRect();
      // Um <main> full-bleed não representa o limite do conteúdo; nesses casos
      // mantemos o alinhamento pela variável/prop de largura máxima.
      if (rect.width >= window.innerWidth - 32) {
        setMeasuredContentLeft(null);
        return;
      }

      const paddingLeft = Number.parseFloat(window.getComputedStyle(anchor).paddingLeft) || 0;
      setMeasuredContentLeft(Math.round(rect.left + paddingLeft));
    };

    frame = window.requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    const anchor = document.querySelector<HTMLElement>('[data-header-align], main');
    if (anchor && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(anchor);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [location.pathname]);

  useEffect(() => {
    if (!transparent || !scrollTransition) return;
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [transparent, scrollTransition]);

  return (
    <>
      <nav ref={navRef} className={`luma-nav-v2 ${transparent && !isScrolled ? 'transparent' : 'opaque'} ${isDarkTheme ? 'dark-mode-override' : ''} ${isMobileMenuOpen ? 'mobile-menu-open' : ''}`} style={{
        position: fixed ? 'fixed' : 'absolute', top: 0, left: 0, right: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        transition: 'all 0.3s ease',
      }}>
        {/* Logo (Extremidade Esquerda) */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
          <Link
            to="/"
            className="logo-wrapper"
            onContextMenu={handleLogoContextMenu}
            aria-label="Fauves — página inicial"
            aria-haspopup="menu"
            aria-expanded={isLogoMenuOpen}
          >
            <FauvesLogo isDark={isDarkTheme} />
          </Link>

          <AnimatePresence>
            {isLogoMenuOpen && (
              <>
                <div
                  className="logo-context-dismiss"
                  onClick={() => setIsLogoMenuOpen(false)}
                  onContextMenu={(event) => { event.preventDefault(); setIsLogoMenuOpen(false); }}
                />
                <motion.div
                  role="menu"
                  aria-label="Recursos da marca Fauves"
                  initial={{ opacity: 0, scale: 0.96, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -4 }}
                  transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
                  className={`logo-context-menu ${isDarkTheme ? 'is-dark' : ''}`}
                >
                  <span className="logo-context-arrow" />
                  <button type="button" role="menuitem" onClick={copyBrandSvg} className="logo-context-action">
                    {logoCopyState === 'copied' ? <Check size={16} /> : <Copy size={16} />}
                    <span>{logoCopyState === 'copied' ? 'SVG copiado' : logoCopyState === 'error' ? 'Não foi possível copiar' : 'Copiar logotipo como SVG'}</span>
                  </button>
                  <button type="button" role="menuitem" onClick={downloadBrandAssets} className="logo-context-action">
                    <Download size={16} />
                    <span>Baixar Recursos de Marca</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Menu Central (Alinhado dinamicamente com o conteúdo da página) */}
        {isLoggedIn && (
          <div className={`header-content-alignment ${measuredContentLeft !== null ? 'is-measured' : ''}`} style={{
            position: 'absolute',
            left: measuredContentLeft === null ? '50%' : `${measuredContentLeft}px`,
            transform: measuredContentLeft === null ? 'translateX(-50%)' : 'none',
            width: measuredContentLeft === null ? '100%' : 'auto',
            maxWidth: measuredContentLeft === null ? resolvedMaxWidth : 'none',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start', // Alinha o início do menu com o início do conteúdo abaixo
            transition: 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div className="authenticated-nav" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              pointerEvents: 'auto'
            }}>
              <Link to="/events" className="luma-nav-link" style={{ color: contentColor }}>
                <EventosIcon />
                <span>Eventos</span>
              </Link>
              <Link to="/organizations" className="luma-nav-link" style={{ color: contentColor }}>
                <OrganizacoesIcon />
                <span>Calendários</span>
              </Link>
              <Link to="/discover" className="luma-nav-link" style={{ color: contentColor }}>
                <DescobrirIcon />
                <span>Descobrir</span>
              </Link>
            </div>
          </div>
        )}

        {/* Extremidade Direita: Ícones e Ações */}
        <div className="header-desktop-actions" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexShrink: 0 }}>
          {!isLoggedIn ? (
            <>
              <a href={explorarLink} className="luma-nav-link" style={{ color: contentColor }}>
                {explorarText}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 17L17 7M17 7H7M17 7v10" />
                </svg>
              </a>
              <Link to={actionButtonLink} className={`lux-button flex-center small ${isDarkTheme ? 'light solid' : 'dark solid'} round`} style={{ textDecoration: 'none' }}>
                <div className="label">{actionButtonText}</div>
              </Link>
            </>
          ) : (
            <>
              <Link to="/create" className="luma-nav-link" style={{ color: contentColor, fontWeight: 600 }}>
                Criar Evento
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <button
                  className="luma-icon-btn-hero tooltip-bottom"
                  data-tooltip="Buscar — Ctrl + K"
                  onClick={() => setIsSearchOpen(true)}
                  style={{ color: contentColor }}
                >
                  <SearchIcon />
                </button>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button
                    className="luma-icon-btn-hero tooltip-bottom"
                    data-tooltip="Notificações"
                    onClick={() => setIsNotificationsOpen(prev => !prev)}
                    style={{ color: contentColor }}
                  >
                    <BellIcon />
                  </button>
                  <NotificationMenu isOpen={isNotificationsOpen} isDark={isDarkTheme} onClose={() => setIsNotificationsOpen(false)} />
                </div>

                <div style={{ position: 'relative', marginLeft: '0.5rem' }}>
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="luma-icon-btn-hero"
                    style={{ padding: 0, width: 24, height: 24, overflow: 'hidden', border: isDarkTheme ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0,0,0,0.1)' }}
                  >
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', color: contentColor, fontSize: '12px' }}>
                        {user?.name?.[0] || 'U'}
                      </div>
                    )}
                  </button>
                  <ProfileMenu
                    isOpen={isProfileMenuOpen}
                    user={user}
                    isDark={isDarkTheme}
                    onClose={() => setIsProfileMenuOpen(false)}
                    logout={logout}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          className="header-mobile-trigger"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
          aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="fauves-mobile-menu"
          style={{ color: contentColor }}
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="fauves-mobile-menu"
            className={`header-mobile-menu ${isDarkTheme ? 'is-dark' : 'is-light'}`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu principal"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="header-mobile-menu-inner">
              <nav className="header-mobile-links" aria-label="Navegação mobile">
                {isLoggedIn ? (
                  <>
                    <Link to="/events"><EventosIcon /><span>Eventos</span><ChevronRight size={18} /></Link>
                    <Link to="/organizations"><OrganizacoesIcon /><span>Calendários</span><ChevronRight size={18} /></Link>
                    <Link to="/discover"><DescobrirIcon /><span>Descobrir</span><ChevronRight size={18} /></Link>
                    <Link to="/create"><Plus size={17} /><span>Criar evento</span><ChevronRight size={18} /></Link>
                    <button type="button" onClick={() => { setIsMobileMenuOpen(false); setIsSearchOpen(true); }}>
                      <Search size={17} /><span>Buscar</span><ChevronRight size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <Link to={explorarLink}><Compass size={17} /><span>{explorarText}</span><ChevronRight size={18} /></Link>
                    <Link to="/pricing"><Calendar size={17} /><span>Preços</span><ChevronRight size={18} /></Link>
                    <Link to="/ajuda"><HelpCircle size={17} /><span>Central de Ajuda</span><ChevronRight size={18} /></Link>
                  </>
                )}
              </nav>

              {isLoggedIn ? (
                <div className="header-mobile-account">
                  <Link to={`/u/${user?.id}`} className="header-mobile-profile">
                    <span className="header-mobile-avatar">
                      {user?.photoUrl ? <img src={user.photoUrl} alt="" /> : (user?.name?.[0] || 'U')}
                    </span>
                    <span className="header-mobile-profile-copy">
                      <strong>{user?.name || 'Minha conta'}</strong>
                      <small>{user?.email}</small>
                    </span>
                    <ChevronRight size={18} />
                  </Link>
                  <div className="header-mobile-account-actions">
                    <Link to="/v2/account-settings"><Settings size={16} /> Configurações</Link>
                    <button type="button" onClick={() => { setIsMobileMenuOpen(false); logout(); }}><LogOut size={16} /> Sair</button>
                  </div>
                </div>
              ) : (
                <div className="header-mobile-ctas">
                  <Link to={actionButtonLink} className="header-mobile-login">{actionButtonText}</Link>
                  <Link to="/create" className="header-mobile-create">Criar meu evento</Link>
                </div>
              )}

              <nav className="header-mobile-legal" aria-label="Links institucionais">
                <Link to="/termos-de-uso">Termos</Link>
                <Link to="/politica-de-privacidade">Privacidade</Link>
                <Link to="/seguranca">Segurança</Link>
                <Link to="/dmca">DMCA</Link>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchModal isOpen={isSearchOpen} isDark={isDarkTheme} onClose={() => setIsSearchOpen(false)} />

      <style>{`
        .luma-nav-v2, .luma-nav-v2 * {
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        }

        .header-blue-page {
          position: relative;
          isolation: isolate;
        }

        .header-blue-page::before {
          content: '';
          position: absolute;
          z-index: -1;
          top: 0;
          left: 0;
          width: 100%;
          height: 380px;
          pointer-events: none;
        }

        .header-blue-page-dark::before {
          background:
            radial-gradient(900px 380px at 50% -100px, rgba(53, 113, 160, 0.34), transparent 72%),
            linear-gradient(180deg, rgba(17, 24, 32, .96) 0, rgba(18, 20, 22, .72) 190px, transparent 100%);
        }

        .header-blue-page-light::before {
          height: 300px;
          background:
            radial-gradient(820px 300px at 50% -110px, rgba(42, 42, 215, .14), transparent 72%),
            linear-gradient(180deg, rgba(226, 232, 240, .88) 0, rgba(241, 244, 248, .58) 150px, transparent 100%);
        }

        .header-content-alignment {
          padding-left: var(--page-content-padding, 16px);
          padding-right: var(--page-content-padding, 16px);
        }

        .header-content-alignment.is-measured {
          padding-left: 0;
          padding-right: 0;
        }

        .header-mobile-trigger {
          display: none;
          width: 42px;
          height: 42px;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 1px solid transparent;
          border-radius: 10px;
          background: transparent;
          cursor: pointer;
        }

        .header-mobile-menu {
          position: fixed;
          z-index: 999;
          inset: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          padding: calc(76px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));
        }
        .header-mobile-menu.is-dark {
          color: #fff;
          background: rgba(17, 20, 22, .98);
        }
        .header-mobile-menu.is-light {
          color: #131517;
          background: rgba(247, 248, 249, .98);
        }
        .header-mobile-menu-inner {
          display: flex;
          width: min(100%, 520px);
          min-height: calc(100dvh - 116px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
          margin: 0 auto;
          flex-direction: column;
        }
        .header-mobile-links {
          display: flex;
          flex-direction: column;
        }
        .header-mobile-links > a,
        .header-mobile-links > button {
          display: grid;
          grid-template-columns: 22px minmax(0, 1fr) 18px;
          min-height: 54px;
          align-items: center;
          gap: 10px;
          padding: 0 4px;
          border: 0;
          border-bottom: 1px solid currentColor;
          border-radius: 0;
          background: transparent;
          color: inherit;
          cursor: pointer;
          font: inherit;
          font-size: 16px;
          font-weight: 600;
          text-align: left;
          text-decoration: none;
        }
        .header-mobile-menu.is-dark .header-mobile-links > a,
        .header-mobile-menu.is-dark .header-mobile-links > button { border-bottom-color: rgba(255,255,255,.09); }
        .header-mobile-menu.is-light .header-mobile-links > a,
        .header-mobile-menu.is-light .header-mobile-links > button { border-bottom-color: rgba(19,21,23,.1); }
        .header-mobile-links > a > svg:last-child,
        .header-mobile-links > button > svg:last-child { opacity: .4; }
        .header-mobile-account {
          margin-top: 22px;
          padding: 14px;
          border: 1px solid rgba(128,128,128,.16);
          border-radius: 14px;
          background: rgba(128,128,128,.06);
        }
        .header-mobile-profile {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 12px;
          color: inherit;
          text-decoration: none;
        }
        .header-mobile-avatar {
          display: grid;
          width: 42px;
          height: 42px;
          flex: 0 0 42px;
          overflow: hidden;
          place-items: center;
          border-radius: 50%;
          background: rgba(128,128,128,.16);
          font-weight: 700;
        }
        .header-mobile-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .header-mobile-profile-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; }
        .header-mobile-profile-copy strong,
        .header-mobile-profile-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .header-mobile-profile-copy strong { font-size: 14px; }
        .header-mobile-profile-copy small { margin-top: 2px; opacity: .5; font-size: 12px; }
        .header-mobile-account-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 14px;
        }
        .header-mobile-account-actions a,
        .header-mobile-account-actions button {
          display: flex;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 0 10px;
          border: 0;
          border-radius: 9px;
          background: rgba(128,128,128,.1);
          color: inherit;
          cursor: pointer;
          font: inherit;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
        }
        .header-mobile-ctas {
          display: grid;
          grid-template-columns: .8fr 1.2fr;
          gap: 10px;
          margin-top: 24px;
        }
        .header-mobile-ctas a {
          display: flex;
          min-height: 48px;
          align-items: center;
          justify-content: center;
          padding: 0 14px;
          border-radius: 11px;
          color: inherit;
          font-size: 14px;
          font-weight: 700;
          text-decoration: none;
        }
        .header-mobile-login { border: 1px solid rgba(128,128,128,.24); }
        .header-mobile-create { background: #2A2AD7; color: #fff !important; }
        .header-mobile-legal {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 18px;
          margin-top: auto;
          padding-top: 32px;
        }
        .header-mobile-legal a {
          color: inherit;
          font-size: 12px;
          font-weight: 600;
          opacity: .45;
          text-decoration: none;
        }

        @media (max-width: 767px) {
          .luma-nav-v2 {
            min-height: calc(64px + env(safe-area-inset-top));
            padding-top: calc(.7rem + env(safe-area-inset-top)) !important;
            padding-right: 14px !important;
            padding-left: 14px !important;
          }
          .luma-nav-v2.mobile-menu-open {
            background: transparent !important;
            border-bottom-color: transparent !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          .header-desktop-actions,
          .header-content-alignment { display: none !important; }
          .header-mobile-trigger { display: inline-flex; }
          .luma-nav-v2.dark-mode-override .header-mobile-trigger { background: rgba(255,255,255,.07); }
          .luma-nav-v2:not(.dark-mode-override) .header-mobile-trigger { background: rgba(19,21,23,.055); }
        }

        .luma-nav-v2.transparent {
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-bottom: none !important;
          box-shadow: none !important;
        }

        .luma-nav-v2.opaque {
          background: rgba(255, 255, 255, 0.72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        /* Dark mode: header opaque com fundo #131517 translúcido */
        .luma-nav-v2.dark-mode-override.opaque {
          background: rgba(19, 21, 23, 0.82) !important;
          backdrop-filter: blur(24px) !important;
          -webkit-backdrop-filter: blur(24px) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3) !important;
        }

        /* Dark mode: header transparente ainda mantém ícones legíveis */
        .luma-nav-v2.dark-mode-override.transparent {
          background: transparent !important;
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
          border-bottom: none !important;
          box-shadow: none !important;
        }

        .luma-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
          font-size: 0.875rem;
          transition: opacity 0.2s;
          text-decoration: none;
        }
        .luma-nav-link:hover { opacity: 0.8; }

        .logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          min-height: 44px;
          transition: transform 0.2s cubic-bezier(.4, 0, .2, 1), color 0.2s ease;
          text-decoration: none;
          cursor: pointer;
          color: rgba(19, 21, 23, 0.45) !important;
        }
        .logo-wrapper:hover {
          color: #131517 !important;
        }
        .luma-nav-v2.dark-mode-override .logo-wrapper {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .luma-nav-v2.dark-mode-override .logo-wrapper:hover {
          color: #ffffff !important;
        }
        .logo-wrapper:active {
          transform: scale(0.96);
        }

        .header-fauves-logo {
          display: block;
          width: 54px;
          height: auto;
          overflow: visible;
          transform-origin: center;
          transition: transform 0.42s cubic-bezier(.2, .85, .25, 1);
        }

        .header-fauves-logo.is-light { color: #2a2ad7; }
        .header-fauves-logo.is-dark { color: #ffffff; }

        .fauves-logo-cut {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center;
          transition:
            transform 0.58s cubic-bezier(.16, 1, .3, 1),
            opacity 0.18s ease;
          will-change: transform, opacity;
        }

        .fauves-logo-cut-f { transform: translate(-44px, -30px) rotate(-13deg) scale(.78); transition-delay: 0ms; }
        .fauves-logo-cut-a { transform: translate(-15px, 42px) rotate(10deg) scale(.72); transition-delay: 35ms; }
        .fauves-logo-cut-u { transform: translate(8px, -44px) rotate(-9deg) scale(.76); transition-delay: 70ms; }
        .fauves-logo-cut-v { transform: translate(14px, 40px) rotate(8deg) scale(.74); transition-delay: 105ms; }
        .fauves-logo-cut-e { transform: translate(34px, -32px) rotate(-11deg) scale(.8); transition-delay: 140ms; }
        .fauves-logo-cut-s { transform: translate(48px, 24px) rotate(14deg) scale(.72); transition-delay: 175ms; }

        .logo-wrapper:hover .header-fauves-logo,
        .logo-wrapper:focus-visible .header-fauves-logo,
        .logo-wrapper:focus-within .header-fauves-logo {
          transform: none;
        }

        .logo-wrapper:hover .fauves-logo-cut,
        .logo-wrapper:focus-visible .fauves-logo-cut,
        .logo-wrapper:focus-within .fauves-logo-cut {
          opacity: 1;
          transform: translate(0, 0) rotate(0) scale(1);
        }

        @media (max-width: 767px), (hover: none), (pointer: coarse) {
          .fauves-logo-cut {
            opacity: 1;
            transform: translate(0, 0) rotate(0) scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .header-fauves-logo,
          .fauves-logo-cut {
            transition: none;
          }

          .fauves-logo-cut {
            opacity: 1;
            transform: none;
          }
        }

        .logo-context-dismiss {
          position: fixed;
          inset: 0;
          z-index: 1000;
        }
        .logo-context-menu {
          position: absolute;
          z-index: 1002;
          top: calc(100% + 10px);
          left: 0;
          width: 260px;
          padding: 5px;
          border: 1px solid rgba(19,21,23,.09);
          border-radius: 11px;
          background: rgba(255,255,255,.94);
          box-shadow: 0 10px 28px rgba(0,0,0,.18);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          transform-origin: top left;
        }
        .logo-context-menu.is-dark {
          border-color: rgba(255,255,255,.08);
          background: rgba(35,36,38,.96);
          box-shadow: 0 10px 28px rgba(0,0,0,.42);
        }
        .logo-context-arrow {
          position: absolute;
          top: -6px;
          left: 25px;
          width: 10px;
          height: 10px;
          border-left: 1px solid rgba(19,21,23,.09);
          border-top: 1px solid rgba(19,21,23,.09);
          background: rgba(255,255,255,.94);
          transform: rotate(45deg);
        }
        .logo-context-menu.is-dark .logo-context-arrow {
          border-color: rgba(255,255,255,.08);
          background: rgba(35,36,38,.96);
        }
        .logo-context-action {
          position: relative;
          z-index: 1;
          display: flex;
          width: 100%;
          height: 36px;
          align-items: center;
          gap: 9px;
          padding: 0 9px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          color: rgba(19,21,23,.82);
          font-size: 13px;
          font-weight: 550;
          line-height: 1;
          white-space: nowrap;
          text-align: left;
          cursor: pointer;
          transition: background .15s ease, color .15s ease;
        }
        .logo-context-action svg {
          flex: 0 0 auto;
          color: rgba(19,21,23,.48);
        }
        .logo-context-action:hover,
        .logo-context-action:focus-visible {
          outline: none;
          background: rgba(19,21,23,.07);
          color: #131517;
        }
        .logo-context-menu.is-dark .logo-context-action {
          color: rgba(255,255,255,.92);
        }
        .logo-context-menu.is-dark .logo-context-action svg {
          color: rgba(255,255,255,.54);
        }
        .logo-context-menu.is-dark .logo-context-action:hover,
        .logo-context-menu.is-dark .logo-context-action:focus-visible {
          background: rgba(255,255,255,.09);
          color: #fff;
        }
        @media (max-width: 420px) {
          .logo-context-menu {
            left: 0;
            width: min(260px, calc(100vw - 32px));
          }
        }
        
        .authenticated-nav .luma-nav-link {
          gap: 0.5rem;
          color: rgba(19, 21, 23, 0.45) !important;
          font-weight: 500;
          transition: color 0.25s ease;
        }
        .authenticated-nav .luma-nav-link:hover {
          color: #131517 !important;
        }
        
        /* Tema Escuro Adaptando os links autenticados */
        .luma-nav-v2.dark-mode-override .authenticated-nav .luma-nav-link {
           color: rgba(255, 255, 255, 0.5) !important;
        }
        .luma-nav-v2.dark-mode-override .authenticated-nav .luma-nav-link:hover {
           color: #ffffff !important;
        }

        .luma-icon-btn-hero {
          background: transparent;
          border: none;
          padding: 8px;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          opacity: 0.85;
          position: relative;
        }
        .luma-icon-btn-hero:hover {
          opacity: 1;
          background: rgba(128,128,128,0.1);
        }

        /* LUX Button System */
        .lux-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          white-space: nowrap;
          position: relative;
          transition: all 0.2s cubic-bezier(.4,0,.2,1);
          text-decoration: none;
          cursor: pointer;
          min-width: 0;
          width: fit-content;
        }

        .lux-button.small {
          height: 32px;
          padding: 0 1rem;
          font-size: 0.875rem;
        }

        .lux-button.round {
          border-radius: 100px;
        }

        /* Glassmorphism for dark theme (white text/icons) */
        .lux-button.light.solid {
          background-color: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .lux-button.light.solid:hover {
          background-color: rgba(255, 255, 255, 0.25);
        }

        .lux-button.dark.solid {
          background-color: #131517;
          color: #ffffff;
          border: 1px solid #131517;
        }
        .lux-button.dark.solid:hover {
          background-color: #212325;
        }

        .lux-button .label {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .lux-menu-wrapper {
          background-color: rgba(255, 255, 255, 0.9) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-radius: 12px !important;
          border: 1px solid rgba(19, 21, 23, 0.08) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15) !important;
        }

        .menu-action-row {
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 14px;
          color: #131517;
          transition: background 0.2s;
          display: flex;
          align-items: center;
          text-decoration: none;
        }
        .menu-action-row:hover {
          background-color: rgba(19, 21, 23, 0.04);
        }

        .lux-menu-arrow.arrow-up {
          position: absolute;
          width: 0; height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-bottom: 8px solid rgba(255, 255, 255, 0.9);
          top: -8px;
        }

        /* Dark Mode Overrides */
        html.dark .lux-menu-wrapper {
          background-color: rgba(30, 31, 34, 0.95) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5) !important;
        }
        html.dark .menu-action-row {
          color: rgba(255, 255, 255, 0.9) !important;
        }
        html.dark .menu-action-row:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
        html.dark .lux-menu-arrow.arrow-up {
          border-bottom-color: rgba(30, 31, 34, 0.95) !important;
        }
        html.dark .search-list-item:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
      `}</style>
    </>
  );
};

export default HeaderV2;
