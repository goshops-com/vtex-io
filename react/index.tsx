import React, { useEffect } from 'react'
import { canUseDOM } from 'vtex.render-runtime'
import { useOrderItems } from 'vtex.order-items/OrderItems'

import type { PixelMessage } from './typings/events'

// Event bus for communication between non-React code and React components
export const vtexEventBus = {
  listeners: new Set<(event: PixelMessage) => void>(),

  subscribe(callback: (event: PixelMessage) => void) {
    this.listeners.add(callback);
    return () => { this.listeners.delete(callback) };
  },

  emit(event: PixelMessage) {
    this.listeners.forEach(listener => listener(event));
  }
};

// React component that handles events requiring hooks
const EventHandler: React.FC = () => {
  const { addItems } = useOrderItems()

  useEffect(() => {
    const unsubscribe = vtexEventBus.subscribe(async (e: PixelMessage) => {
      if (e.data?.eventName === 'vtex:handleAddToCart' && e.data.items) {
        try {
          const items = await addItems(e.data.items, {
            marketingData: {},
            allowedOutdatedData: ['paymentData']
          })
          console.log(items)
        } catch (error) {
          console.error('Error adding items to cart:', error)
        }
      }
    });

    return unsubscribe;
  }, [addItems]);

  return null;
}

export default EventHandler;

export function handleEvents(e: PixelMessage) {
  console.log('Event: ', e.data?.eventName);

  switch (e.data.eventName) {

    case 'vtex:handleAddToCart': {
      // Emit to event bus - the React component will handle this
      vtexEventBus.emit(e);
      break
    }
    case 'vtex:productView': {
      if(e.data.product?.productId){

        window.gsSDK.getContentByContext('product_detail', {"product_id": e.data.product?.productId, "singlePage": true});

        window.gsSDK.addInteraction({
          "event": "view",
          "item": e.data.product.productId
        });
      }
      break
    }
    case 'vtex:userData': {
      if(e.data?.email){
        retryLogin(3, 0, e.data?.id ,e.data?.email, true);
      }else{
        window.gsSDK?.logout();
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

      let path = window.location.pathname;
      const productDetailRegex = /\/[^/]+\/p$/;
      if (productDetailRegex.test(path)) return;

      const context = getContext();
      let { pageType, ...contentWithoutPageType } = context;
      
      retryContentByContext(3, 0, pageType,contentWithoutPageType);

      break;
    }
    
    default: {
      break
    }
  }
}

if (canUseDOM) {
  window.addEventListener('message', handleEvents)
}else{
  console.log('canUseDOM is false');
  setTimeout(() => {
    window.addEventListener('message', handleEvents);
  }, 500);
}

function retryContentByContext(maxTries: number, tries: number,pageType: string, contentWithoutPageType: { singlePage: boolean; preProcess?: undefined; fieldValue?: undefined; } | { preProcess: string[]; fieldValue: string; singlePage: boolean; }){
  if(window.gsSDK){
      window.gsSDK.getContentByContext(pageType, contentWithoutPageType);
      return null;
  }
  else{
    if(tries < maxTries){
      return setTimeout(()=> {
        retryContentByContext(maxTries,tries++, pageType,contentWithoutPageType);
      },100)
    }else{
      return null;
    }
    
  }
}

function retryLogin(maxTries: number, tries: number, id: string | undefined, email: string, param_updateCartFromCustomer: boolean){
  if(window.gsSDK){
      window.gsSDK.login(id, {email: email, param_updateCartFromCustomer: param_updateCartFromCustomer});
      return null;
  }
  else{
    if(tries < maxTries){
      return setTimeout(()=> {
        retryLogin(maxTries,tries++, id, email, param_updateCartFromCustomer);
      },100)
    }else{
      return null;
    }
    
  }
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
    return { pageType: 'home', singlePage: true}
  }

  // New regex pattern to match paths ending with "/p" before query parameters
  const productDetailRegex = /\/[^/]+\/p$/;
  if (productDetailRegex.test(path)) {
    return { pageType: 'product_detail', preProcess: ["findItemByField:url"], fieldValue: url, singlePage: true  };
  }

  // Adjusted to check for both the pathname and hash for the checkout page
  if (path.startsWith('/checkout/') && hash.includes('#/cart')) {
    return { pageType: 'checkout', singlePage: true }; // Changed 'cart' to 'checkout' to match your requirement
  }

  // Default case if none of the above conditions are met
  return { pageType: 'unknown', singlePage: true };
}

