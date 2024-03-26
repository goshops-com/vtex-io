import { canUseDOM } from 'vtex.render-runtime'

import type { PixelMessage } from './typings/events'

export async function handleEvents(e: PixelMessage) {
  console.log('Event: ', e.data?.eventName);
  
  switch (e.data.eventName) {
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
    case 'vtex:addToCart': {
      if(e.data?.items?.length > 0 && e.data?.items[0].productId){
        window.gsSDK.addInteraction({
          "event": "cart",
          "item": e.data?.items[0].productId,
          "quantity": e.data?.items[0].quantity,
          "price": e.data?.items[0].price
        });
      }
      
      break;
    }
    case 'vtex:removeFromCart': {
      if(e.data?.items?.length > 0 && e.data?.items[0].productId){
        window.gsSDK.addInteraction({
          "event": "remove-cart",
          "item": e.data?.items[0].productId,
          "quantity": e.data?.items[0].quantity,
          "price": e.data?.items[0].price
        });
      }
      
      break;
    }
    case 'vtex:cartChanged': {
      console.log( 'cartChanged' , JSON.stringify(e.data || ''));

      if(e.data?.items?.length > 0){
        const state = {
          cart: {
            amountOfProducts: getAmountOfProducts(e.data.items),
            totalAmount: getTotalAmount(e.data.items),
            products: e.data.items.map(item => {
              return {
                id: item.productId,
                price: item.price,
                quantity: item.quantity,
                image_url: item.imageUrl,
              }
            })
          }
        }
        window.gsSDK.updateState(state);
      }else{
        window.gsSDK.addInteraction({
          "event": "clean-cart"
        });
      }
    
      break;
    }
    case 'vtex:orderPlaced': {
      
      if(e.data?.transactionId){
        window.gsSDK.addInteractionState('cart', { "transactionId": e.data?.transactionId });
      }else{
        window.gsSDK.addInteractionState('cart');
      }
      
      break;
    }
    case 'vtex:pageView' : {
      console.log('page data', e.data);

      const context = getContext();
      let { pageType, ...contentWithoutPageType } = context;
      
      window.gsSDK.getContentByContext(pageType, contentWithoutPageType);

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
function getAmountOfProducts(items: import("./typings/events").CartItem[]) {
  let amount = 0;
  items.forEach(item => {
    amount += item.quantity;
  });
  return amount;
}

function getTotalAmount(items: import("./typings/events").CartItem[]) {
  let amount = 0;
  items.forEach(item => {
    amount += item.price * item.quantity;
  });
  return amount;
}

function getContext(){
  let path = window.location.pathname;
  let hash = window.location.hash; 
  let url = window.location.href;

  if (path == '/'){
    return { pageType: 'home'}
  }

  // New regex pattern to match paths ending with "/p" before query parameters
  const productDetailRegex = /\/[^/]+\/p$/;
  if (productDetailRegex.test(path)) {
    return { pageType: 'product_detail', preProcess: ["findItemByField:url"], fieldValue: url  };
  }

  // Adjusted to check for both the pathname and hash for the checkout page
  if (path.startsWith('/checkout/') && hash.includes('#/cart')) {
    return { pageType: 'checkout' }; // Changed 'cart' to 'checkout' to match your requirement
  }

  // Default case if none of the above conditions are met
  return { pageType: 'unknown' };
}

