import { canUseDOM } from 'vtex.render-runtime'

import type { PixelMessage } from './typings/events'

export function handleEvents(e: PixelMessage) {
  console.log('Event: ', e.data?.eventName);
  
  switch (e.data.eventName) {
    case 'vtex:pageView': {
      break
    }
    case 'vtex:productView': {
      if(e.data.product?.productId){
        window.gsSDK.addInteraction({
          "event": "view",
          "item": e.data.product.productId
        });
      }
      break
    }
    case 'vtex:userData': {
      if(e.data?.email){
        window.gsSDK.login('customer_id', {email: e.data?.email, param_updateCartFromCustomer: true});
      }else{
        window.gsSDK.logout();
      }
      break;
    }
    case 'vtex:addToWishlist': {
      if(e.data?.items?.product?.productId){
        window.gsSDK.addInteraction({
          "event": "like",
          "item": e.data.items.product.productId
        });
      }
      
      break;
    }

    default: {
      break
    }
  }
}

if (canUseDOM) {
  window.addEventListener('message', handleEvents)
}
