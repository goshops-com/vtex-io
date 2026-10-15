
# Install the gopersonal VTEX app
Follow the steps below to install the gopersonal VTEX app in your store.

## Step 1: Change the vendor in the `manifest.json` file to your store account name.

## Step 2: Check the VTEX IO documentation [here](https://developers.vtex.com/docs/guides/vtex-io-documentation-publishing-an-app).

## Step 3: Add your clientId in the VTEX app configurations You can get your clientId in the integration panel once created.
![alt text](https://gs-prod-public.goshops.ai/uploads/2025/01/0caf5b29-e1c4-4ff2-9e3f-a7c9b810b2ad.webp)

## Step 4: In your VTEX admin in the App Management section go to gopersonal App.

![alt text](https://gs-prod-public.goshops.ai/uploads/2025/01/43d89425-143f-46c7-a088-e17166c9a41d.webp)
## Step 5: Open the app settings, paste the clientId and click save.

![alt text](https://gs-prod-public.goshops.ai/uploads/2025/01/ec8d0539-a709-4881-85a4-badac0e92592.webp)

## Step 6: Setup the checkout page
Open Checkout section, in file checkout6-custom.js:

https://ACCOUNT.myvtex.com/admin/portal/#/sites/default/code/files/checkout6-custom.js

Add the snippet replacing "REPLACE_ME_CLIENT_ID" with your clientId:

```javascript
async function initializeGSSDK() {
    window.gsSDK = await new window.GSSDK.default('REPLACE_ME_CLIENT_ID', {
        provider: 'Vtex',
        context: {pageType: 'checkout'}
    });
}
var gsSDKScript = document.createElement('script');
gsSDKScript.src = 'https://sdk.gopersonal.ai/gs-sdk.js';
gsSDKScript.onload = initializeGSSDK;
document.head.appendChild(gsSDKScript);
```

### Checkout with existing custom code

> **When to use this:** only if your store **already has custom checkout code**, for example because you installed the VTEX checkout UI custom component and added your own code (cart bars, step styles, etc.). If you have no custom checkout code yet, use the snippet from the previous step as is.

**Where to edit the code**

If the checkout UI custom component is installed, edit the code from the VTEX Admin:

`https://ACCOUNT.myvtex.com/admin/vtex-checkout-ui-custom`

Open the **JavaScript** file (`checkout6-custom.js`), add the snippet and save your changes.

If you don't use that component, edit the file from the legacy path described in the previous step:

`https://ACCOUNT.myvtex.com/admin/portal/#/sites/default/code/files/checkout6-custom.js`

**How to add the snippet**

**Do not replace the file**, or you will lose your existing code. Paste the snippet at the **end of the file, at the top level** (outside any function).

> Do not put it inside functions that run on navigation (for example an `init()` called on `hashchange`). The VTEX checkout is a single-page app (`#/cart`, `#/email`, `#/shipping`, `#/payment`), so the SDK would be loaded on every step.

To avoid loading the SDK twice, use this version with guards:

```javascript
//GoPersonal SDK
async function initializeGSSDK() {
    if (window.gsSDK) return;
    window.gsSDK = await new window.GSSDK.default('REPLACE_ME_CLIENT_ID', {
        provider: 'Vtex',
        context: { pageType: 'checkout' }
    });
}

if (!document.querySelector('script[src="https://sdk.gopersonal.ai/gs-sdk.js"]')) {
    const gsSDKScript = document.createElement('script');
    gsSDKScript.src = 'https://sdk.gopersonal.ai/gs-sdk.js';
    gsSDKScript.onload = initializeGSSDK;
    document.head.appendChild(gsSDKScript);
}
```

Remember to replace `REPLACE_ME_CLIENT_ID` with your clientId.
