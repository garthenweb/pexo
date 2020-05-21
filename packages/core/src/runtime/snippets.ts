export const READY_EVENT = `<script data-px-runtime>window.__px = window.__px || []; window.__px.push('start')</script>`;

export const INVALIDATE_EVENT = `<script data-px-runtime>window.__px = window.__px || []; window.__px.push('invalidate')</script>`;

export const HACK_FIX_UMD_REQUIRE_CALL = `<script data-px-runtime>window.require = function() { console.warn('Calling \`require\` from within a unified module definition is not supported by parcel.') }</script>`;
