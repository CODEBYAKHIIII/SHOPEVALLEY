import React, { useState } from 'react';
import { 
  Trash2, 
  ChevronRight, 
  ShieldCheck, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  MapPin, 
  ShoppingBag, 
  ArrowLeft,
  Loader2,
  Calendar
} from 'lucide-react';
import { CartItem, Product, Order } from '../types';
import { formatINR } from './ProductCard';

interface CartAndCheckoutProps {
  cartItems: CartItem[];
  onModifyQty: (cartItemId: string, quantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onNavigate: (path: string) => void;
  onClearCart: () => void;
  onPlaceOrder: (order: Order) => void;
  currentPath?: string;
}

export default function CartAndCheckout({
  cartItems,
  onModifyQty,
  onRemoveItem,
  onNavigate,
  onClearCart,
  onPlaceOrder,
  currentPath = 'cart'
}: CartAndCheckoutProps) {
  // Sync step with route path instantly
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment' | 'success'>(() => {
    if (currentPath === 'shipping-address') return 'shipping';
    if (currentPath === 'checkout') return 'payment';
    return 'cart';
  });

  // Sync state whenever currentPath shifts
  React.useEffect(() => {
    if (currentPath === 'shipping-address') {
      setStep('shipping');
    } else if (currentPath === 'checkout') {
      setStep('payment');
    } else if (currentPath === 'cart') {
      setStep('cart');
    }
  }, [currentPath]);
  
  // Shipping input state
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [artisanNote, setArtisanNote] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');

  // Payment states
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'confirmed'>('idle');
  const [paymentStatusMessage, setPaymentStatusMessage] = useState('');
  const [placedOrderId, setPlacedOrderId] = useState('');

  // Settle multi-item selection state for Cart items
  const [selectedIds, setSelectedIds] = useState<string[]>(() => cartItems.map(i => i.id));

  // Sync selected IDs if items list updates
  React.useEffect(() => {
    setSelectedIds(prev => {
      const cartItemIds = cartItems.map(i => i.id);
      const activeSelected = prev.filter(id => cartItemIds.includes(id));
      const newlyAdded = cartItemIds.filter(id => !prev.includes(id));
      if (newlyAdded.length > 0) {
        return [...activeSelected, ...newlyAdded];
      }
      return activeSelected;
    });
  }, [cartItems]);

  // Selected checkout items subset
  const selectedItems = cartItems.filter(item => selectedIds.includes(item.id));

  // Calculations: Display Selected Products Total ONLY. No taxes, platform fees, eco shipping or charges!
  const subtotal = selectedItems.reduce((acc, item) => {
    const uPrice = typeof item.unitPrice === 'number' && !isNaN(item.unitPrice) ? item.unitPrice : 0;
    const qty = typeof item.quantity === 'number' && !isNaN(item.quantity) ? item.quantity : 0;
    return acc + Math.round(uPrice * qty * 100) / 100;
  }, 0);
  const total = subtotal;

  // Custom styled confirmation warning dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    itemIdsToRemove: string[];
  }>({
    isOpen: false,
    itemIdsToRemove: []
  });

  const triggerRemoveItemCheck = (id: string) => {
    setConfirmDialog({
      isOpen: true,
      itemIdsToRemove: [id]
    });
  };

  const triggerRemoveSelectedCheck = () => {
    if (selectedIds.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      itemIdsToRemove: selectedIds
    });
  };

  const executeRemovingItems = () => {
    confirmDialog.itemIdsToRemove.forEach(id => {
      onRemoveItem(id);
    });
    setSelectedIds(prev => prev.filter(id => !confirmDialog.itemIdsToRemove.includes(id)));
    setConfirmDialog({ isOpen: false, itemIdsToRemove: [] });
  };

  // Toggle handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(cartItems.map(i => i.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  const handleNextStep = () => {
    if (step === 'cart') {
      if (selectedItems.length === 0) {
        alert('Please select at least one item to proceed.');
        return;
      }
      onNavigate('shipping-address');
    } else if (step === 'shipping') {
      if (!customerName || !email || !address || !city || !zipCode) {
        alert('Please fill in all required shipping fields.');
        return;
      }
      onNavigate('checkout');
    }
  };

  const simulatePayment = () => {
    if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvv || !cardHolder)) {
      alert('Please fill in card credentials to authorize.');
      return;
    }

    setPaymentStatus('processing');
    const messages = [
      'Establishing connection with ShopeValley payment vault...',
      'Encrypting transaction payloads (AES-256)...',
      'Confirming handmade stock allocation with artisans Specified...',
      'Securing immediate workshop delivery routing tags...',
      'Authorizing gateway token approval...'
    ];

    let currentMsgIdx = 0;
    setPaymentStatusMessage(messages[0]);

    const interval = setInterval(() => {
      currentMsgIdx++;
      if (currentMsgIdx < messages.length) {
        setPaymentStatusMessage(messages[currentMsgIdx]);
      } else {
        clearInterval(interval);
        
        const orderId = `SV-${Math.floor(1000 + Math.random() * 9000)}`;
        setPlacedOrderId(orderId);
        
        const trackingSteps = [
          { status: 'Order Verified', description: 'Workshop accepted your order details.', time: 'Just now', done: true },
          { status: 'In Preparation', description: 'Artisan is packing or baking down products.', time: 'Within 24 hours', done: false },
          { status: 'Local Driver Dispatched', description: 'Assigned localized eco-delivery dispatch.', time: 'Estimated tomorrow', done: false },
          { status: 'Delivered', description: 'Hand-delivered to front doorstep with authentication.', time: 'Expected 2 days', done: false }
        ];

        const finalOrder: Order = {
          id: orderId,
          items: selectedItems.map(item => ({
            productId: item.productId,
            name: item.product.name,
            price: item.unitPrice,
            quantity: item.quantity,
            vendorId: item.product.vendorId,
            size: item.selectedSize || item.size || 'Free Size',
            colour: item.selectedColour || item.colour || 'Default',
            variantId: item.variantId
          })),
          subtotal,
          shipping: 0,
          tax: 0,
          total,
          customerName,
          email,
          address,
          city,
          zipCode,
          phone,
          status: 'pending',
          paymentMethod: paymentMethod === 'card' ? 'Visa / Mastercard' : 'ShopeValley Wallet',
          createdAt: new Date().toISOString(),
          estimatedDelivery: 'Within 48 hours',
          trackingSteps
        };

        onPlaceOrder(finalOrder);
        setPaymentStatus('confirmed');
        setStep('success');
        
        // Remove only checked out items from main cart!
        selectedIds.forEach(id => onRemoveItem(id));
      }
    }, 1200);
  };

  if (step === 'success') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center" id="sh_checkout_success">
        <div className="inline-flex items-center justify-center bg-emerald-150 p-5 rounded-full text-emerald-600 mb-6 border border-emerald-200 shadow-sm animate-bounce">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-none mb-2">
          ORDER CONFIRMED!
        </h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
          Thank you, <span className="font-bold text-slate-800">{customerName}</span>. Your payment was validated securely and individual workshops have been notified immediately!
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 text-left space-y-3.5">
          <div className="flex justify-between border-b border-slate-200 pb-3">
            <span className="text-xs font-mono text-slate-400">TRACKING CODE:</span>
            <span className="text-sm font-extrabold text-slate-950 font-mono tracking-wider">{placedOrderId}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Eco-route delivery choice:</span>
            <span className="font-bold text-slate-800">{shippingMethod === 'express' ? 'Workshop Fast Express' : 'Local Artisan Standard'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Destination address:</span>
            <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">{address}, {city}</span>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-slate-100">
            <span className="text-slate-500">Est. Arrival timeframe:</span>
            <span className="font-bold text-emerald-700 flex items-center gap-1.5 font-sans">
              <Calendar className="w-3.5 h-3.5" />
              {shippingMethod === 'express' ? 'By Tomorrow evening' : 'Usually 2 Business Days'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onNavigate(`track-order/${placedOrderId}`)}
            className="flex-grow bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl transition-all shadow cursor-pointer uppercase tracking-wider"
          >
            Track Order In Realtime
          </button>
          
          <button
            onClick={() => onNavigate('')}
            className="flex-grow border border-slate-200 hover:bg-slate-50 text-slate-800 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer uppercase tracking-wider"
          >
            Continue Browsing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8" id="sh_shopping_checkout_flow">
      
      {/* Visual checkout stepper indicator */}
      <div className="flex items-center justify-center gap-2 sm:gap-6 mb-10 text-xs sm:text-sm max-w-xl mx-auto border-b border-slate-200 pb-5">
        <button 
          onClick={() => onNavigate('cart')}
          className={`font-semibold flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
            step === 'cart' ? 'border-slate-900 text-slate-950 font-extrabold' : 'border-transparent text-slate-400'
          }`}
        >
          <span className="bg-slate-100 w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold">1</span>
          Shopping Basket
        </button>
        <ChevronRight className="w-4 h-4 text-slate-300 animate-pulse" />
        <button 
          onClick={() => selectedItems.length > 0 && onNavigate('shipping-address')}
          disabled={selectedItems.length === 0}
          className={`font-semibold flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
            step === 'shipping' ? 'border-slate-900 text-slate-950 font-extrabold' : 'border-transparent text-slate-400'
          }`}
        >
          <span className="bg-slate-100 w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold">2</span>
          Shipping Detail
        </button>
        <ChevronRight className="w-4 h-4 text-slate-300" />
        <button 
          disabled={!customerName || selectedItems.length === 0}
          onClick={() => customerName && onNavigate('checkout')}
          className={`font-semibold flex items-center gap-1.5 pb-2 border-b-2 transition-all ${
            step === 'payment' ? 'border-slate-900 text-slate-950 font-extrabold' : 'border-transparent text-slate-400'
          }`}
        >
          <span className="bg-slate-100 w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold">3</span>
          Secure Payment
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFTSIDE: Main Action Module */}
        <div className="lg:col-span-8">
          
          {/* STEP 1: CART DISPLAY REVIEW */}
          {step === 'cart' && (
            <div className="space-y-6" id="ch_step_cart">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-slate-50 border border-slate-200 p-4 rounded-xl gap-3">
                <div>
                  <h2 className="font-bold text-slate-900 text-md">Items in your cart ({cartItems.length})</h2>
                  <p className="text-xs text-slate-500 font-sans">Each item is a custom shipment crafted directly in independent workshops.</p>
                </div>
                <button 
                  onClick={() => onNavigate('')}
                  className="text-xs text-slate-705 hover:text-amber-500 font-bold flex items-center gap-1 justify-start"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Add Products
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-2xl p-6 bg-white">
                  <div className="p-4 bg-slate-100 border border-slate-200 text-slate-400 rounded-full inline-flex items-center justify-center mb-4 text-center">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-lg">Your Cart is Empty</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Browse ShopeValley's extensive artisan catalogs and support genuine local pottery and wood sculptors!
                  </p>
                  <button 
                    onClick={() => onNavigate('')}
                    className="mt-6 bg-slate-950 text-white font-bold text-xs py-2 px-6 rounded-xl hover:bg-slate-800"
                  >
                    Explore Handmades Now
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selection controllers: Select All / Deselect All */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleSelectAll}
                        className="text-[#0066c0] hover:underline font-bold font-sans cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300 font-normal">|</span>
                      <button 
                        onClick={handleDeselectAll}
                        className="text-[#0066c0] hover:underline font-bold font-sans cursor-pointer"
                      >
                        Deselect All
                      </button>
                    </div>
                    
                    <div className="text-slate-500 font-sans font-medium text-xs">
                      Selected: <span className="text-slate-900 font-bold font-sans">{selectedIds.length}</span> / {cartItems.length} items
                    </div>
                  </div>

                  {/* Batch Actions Toolbar displaying dynamically upon selection */}
                  {selectedIds.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center text-xs text-slate-800">
                      <span className="font-bold">
                        {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'} selected
                      </span>
                      <div>
                        <button
                          onClick={triggerRemoveSelectedCheck}
                          title="Delete Selected Items"
                          className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold p-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors shadow-none"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Cart Item Grid */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
                    {cartItems.map((item) => (
                      <div key={item.id} className="p-4.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3 flex-1">
                          {/* Individual item checkbox */}
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => handleToggleSelect(item.id)}
                            className="w-4.5 h-4.5 rounded border-slate-300 text-amber-500 focus:ring-transparent focus:ring-0 cursor-pointer shrink-0 mt-1 sm:mt-0"
                          />

                          <div className="flex gap-4.5">
                            <img 
                              src={item.product.images[0]} 
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg bg-slate-100 shrink-0 border border-slate-200"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <p className="text-[9px] font-bold text-amber-600 font-mono uppercase bg-amber-50 px-2 py-0.5 rounded w-fit">
                                  {item.product.vendorName}
                                </p>
                                {item.variantId !== 'STANDARD' && (
                                  <span className="text-[9px] font-mono font-extrabold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {item.variantId}
                                  </span>
                                )}
                              </div>
                              <h4 
                                onClick={() => onNavigate(`category/${item.product.category}/${item.product.slug}`)}
                                className="font-bold text-slate-950 hover:text-amber-500 cursor-pointer text-xs sm:text-sm leading-tight mt-1"
                              >
                                {item.product.name}
                              </h4>
                              <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-mono mt-1">
                                <span>Size: <span className="text-slate-800 font-extrabold">{item.selectedSize || item.size || 'Free Size'}</span></span>
                                <span>•</span>
                                <span>Colour: <span className="text-slate-800 font-extrabold">{item.selectedColour || item.colour || 'Default'}</span></span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                          {/* Quantity selector with instant subtotal and cart total updates */}
                          <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
                            <button 
                              onClick={() => onModifyQty(item.id, item.quantity - 1)}
                              className="px-3.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-950 font-extrabold transition-all text-sm"
                            >
                              -
                            </button>
                            <span className="px-3.5 py-1 text-xs text-slate-800 font-bold font-mono">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => onModifyQty(item.id, item.quantity + 1)}
                              className="px-3.5 py-1 text-slate-600 hover:bg-slate-100 hover:text-slate-950 font-extrabold transition-all text-sm"
                            >
                              +
                            </button>
                          </div>

                          {/* Individual prices & actions targeting item.id */}
                          <div className="text-right">
                            <p className="font-extrabold text-slate-900 text-xs sm:text-sm">{formatINR(item.subtotal)}</p>
                            <button 
                              onClick={() => triggerRemoveItemCheck(item.id)}
                              className="text-[10px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 mt-1 justify-end ml-auto cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: SHIPPING DETAILS FOR SELECTED ITEMS */}
          {step === 'shipping' && (
            <div className="space-y-6" id="ch_step_shipping">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left">
                <h3 className="font-extrabold text-slate-950 text-md tracking-tight border-b border-slate-100 pb-3 mb-5">
                  1. Shipping Information
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Address *</label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. j.doe@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white font-sans"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Physical Delivery Street Address *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 1045 Broadway St"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Denver"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Zip / Postal Code *</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 80203"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Phone Number</label>
                    <input 
                      type="tel"
                      placeholder="e.g. 303-555-0192"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white font-sans"
                    />
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50 text-xs">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes for the Artisans</label>
                  <textarea 
                    placeholder="Specify special custom inscriptions, delivery specifications, or gift requests directly..."
                    rows={3}
                    value={artisanNote}
                    onChange={(e) => setArtisanNote(e.target.value)}
                    className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-900 focus:outline-none bg-white h-20 font-sans"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 font-mono">My note is automatically dispatched to each store owner.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: SECURE PAYMENT GATEWAY CARD SIMULATOR */}
          {step === 'payment' && (
            <div className="space-y-6" id="ch_step_payment">
              {paymentStatus === 'processing' ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-lg animate-pulse" id="ch_payment_portal">
                  <div className="inline-flex items-center justify-center text-amber-500 mb-6 relative">
                    <Loader2 className="w-16 h-16 animate-spin duration-1000" />
                    <CreditCard className="w-6 h-6 absolute text-slate-950" />
                  </div>
                  
                  <h3 className="font-extrabold text-slate-950 text-lg uppercase font-sans">
                    Authorizing Secure Escrow
                  </h3>
                  
                  <div className="max-w-sm mx-auto mt-3">
                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 font-mono text-[11px] text-amber-900 leading-normal text-left">
                      {paymentStatusMessage}
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-slate-400 font-mono mt-8">
                    Do not reload this page or close your browser tab. Security handshake in progress.
                  </p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left">
                  <h3 className="font-extrabold text-slate-950 text-md tracking-tight border-b border-slate-100 pb-3 mb-5">
                    Authorize Secured Handcrafted Escrow Payment
                  </h3>

                  <div className="flex gap-4 mb-6">
                    <button 
                      onClick={() => setPaymentMethod('card')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        paymentMethod === 'card' 
                          ? 'bg-slate-950 border-slate-950 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Credit Card Gate
                    </button>
                    <button 
                      onClick={() => setPaymentMethod('wallet')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        paymentMethod === 'wallet' 
                          ? 'bg-slate-950 border-slate-950 text-white shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ShopeValley Wallet (Instant)
                    </button>
                  </div>

                  {paymentMethod === 'card' ? (
                    <div className="space-y-4">
                      {/* Interactive Credit Card Mock */}
                      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 font-mono flex flex-col justify-between h-44 relative overflow-hidden">
                        <div className="absolute right-0 bottom-0 p-12 bg-white/5 rounded-tl-full pointer-events-none select-none" />
                        
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] text-slate-400 font-sans">SECURE ESCROW PAYEE</span>
                            <h4 className="text-[11px] font-bold tracking-widest uppercase font-sans">SHOPEVALLEY CAPTURE</h4>
                          </div>
                          <span className="text-sm font-semibold italic text-slate-300">VISA</span>
                        </div>

                        <div className="text-md sm:text-lg tracking-widest text-center my-2 font-bold select-all">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </div>

                        <div className="flex justify-between items-end text-[10px]">
                          <div>
                            <p className="text-[9px] text-slate-400 font-sans uppercase font-normal">Holder Name</p>
                            <p className="font-bold tracking-wide truncate max-w-[130px] font-sans">{cardHolder || 'CARDOWNER NAME'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-slate-400 font-sans uppercase font-normal">Expiry Date</p>
                            <p className="font-bold">{cardExpiry || 'MM / YY'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Card inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs font-sans">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1">Card Holder Name</label>
                          <input 
                            type="text"
                            placeholder="e.g. JOHN DOE"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-950 focus:outline-none bg-white uppercase font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                          <input 
                            type="text"
                            placeholder="e.g. 4000 1234 5678 9010"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            maxLength={19}
                            className="w-full text-xs sm:text-sm px-3.5 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-950 focus:outline-none bg-white font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Expiry Date</label>
                            <input 
                              type="text"
                              placeholder="MM/YY"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              maxLength={5}
                              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-950 focus:outline-none bg-white text-center font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">CVV Security</label>
                            <input 
                              type="password"
                              placeholder="•••"
                              maxLength={3}
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                              className="w-full text-xs sm:text-sm px-3 py-2 border border-slate-200 rounded-xl focus:ring-1 focus:ring-slate-950 focus:outline-none bg-white text-center font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl text-left space-y-2.5">
                      <p className="font-bold text-emerald-800 text-xs sm:text-sm font-sans">
                        Pre-funded Multivendor Escrow active.
                      </p>
                      <p className="text-xs text-emerald-700/80 leading-relaxed font-sans">
                        No real credentials required. Placed purchase orders immediately debit ShopeValley developer testing funds, holding it transparently until workshop shipping signals delivery.
                      </p>
                    </div>
                  )}

                  <div className="mt-8 pt-5 border-t border-slate-100">
                    <button 
                      onClick={simulatePayment}
                      className="w-full bg-[#10b981] hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider font-sans"
                    >
                      <ShieldCheck className="w-5 h-5 text-white" />
                      Pay Securely & Place Order ({formatINR(total)})
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-2.5 font-mono">
                      Your session is protected with 256-bit encryption. Handcrafted direct support escrow.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* RIGHTSIDE: Basket / Summary sidebar (Persists checkout status) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-sm relative overflow-hidden text-left">
            <h3 className="font-bold text-sm tracking-wide uppercase font-sans border-b border-slate-800/80 pb-3 mb-4 text-slate-100">
              Checkout Summary
            </h3>

            {/* Calculations metrics: strictly Selected Products Total Only */}
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Selected Products Total:</span>
                <span className="font-extrabold text-slate-100">{formatINR(subtotal)}</span>
              </div>
              
              <div className="border-t border-slate-800 pt-3.5 mt-3.5 flex justify-between text-sm">
                <span className="font-extrabold text-amber-400 tracking-wide">GRAND TOTAL:</span>
                <span className="font-black text-lg text-white font-sans">{formatINR(total)}</span>
              </div>
            </div>

            {/* Next step activator inside summary sidebar */}
            {step !== 'payment' && (
              <div className="mt-6 border-t border-slate-800/60 pt-4.5">
                {selectedItems.length > 0 ? (
                  <button 
                    onClick={handleNextStep}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-center flex items-center justify-center gap-1 shadow-md transition-transform active:scale-95 text-xs tracking-wider uppercase cursor-pointer"
                  >
                    Proceed To Next Step
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <p className="text-[11px] text-amber-500 text-left font-mono">
                    Must select items in basket to checkout.
                  </p>
                )}
              </div>
            )}
          </div>
          
          {/* Back to catalog helper */}
        </div>

      </div>

      {/* Confirmation warning modal dialogue targeting user removal constraints */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <h3 className="text-sm font-bold text-slate-900 text-left uppercase">Remove Item</h3>
            <p className="text-xs text-slate-500 mt-2 text-left leading-relaxed">
              Are you sure you want to remove the selected item(s) from your cart?
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, itemIdsToRemove: [] })}
                className="px-4 py-2 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeRemovingItems}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-[11px] font-bold hover:bg-rose-700 transition-colors cursor-pointer shadow-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
