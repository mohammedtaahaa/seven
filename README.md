# SE7EN – Jersey Store Setup Guide

## Files in this project
- `index.html` – Main website
- `style.css` – All styling (Red/Black/White theme)
- `app.js` – All logic (cart, checkout, Razorpay, Supabase)

---

## STEP 1: Set up Supabase (Backend)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to **SQL Editor** and run:

```sql
CREATE TABLE orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  delivery_address TEXT,
  items JSONB,
  total_amount INTEGER,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

4. Go to **Project Settings → API**
5. Copy your **Project URL** and **anon/public key**
6. Open `app.js` and replace:
   - `https://qqbrvcbhjtkeppgwqrnp.supabase.co` → your Project URL
   - `YOUR_SUPABASE_ANON_KEY` → your anon key

---

## STEP 2: Set up Razorpay

1. Go to https://razorpay.com and create a free account
2. Complete KYC verification
3. Go to **Settings → API Keys → Generate Key**
4. Copy your **Key ID** (starts with `rzp_live_` or `rzp_test_`)
5. Open `app.js` and replace `YOUR_RAZORPAY_KEY_ID` with your Key ID

> For testing, use test mode key `rzp_test_xxxxx`

---

## STEP 3: Add your product images

In `app.js`, in the `products` array, each product has an `emoji` field.
To use real jersey images:
1. Upload your jersey images to a free host (Cloudinary, ImgBB, or Supabase Storage)
2. In `index.html`, the `product-placeholder` div can be replaced with:
   ```html
   <img src="YOUR_IMAGE_URL" alt="Jersey Name">
   ```
   Or update the render function in `app.js` to use `p.image` field.

---

## STEP 4: Add your own products

In `app.js`, edit the `products` array:
```js
{
  id: 13,
  name: 'YOUR JERSEY NAME',
  category: 'football', // football / basketball / cricket / retro
  price: 1299,
  badge: 'NEW',         // or null for no badge
  desc: 'Short description',
  emoji: '⚽',          // displayed until you add a real image
  sizes: ['S', 'M', 'L', 'XL', 'XXL']
}
```

---

## STEP 5: Deploy (Free Hosting)

### Option A – Netlify (Recommended)
1. Go to https://netlify.com
2. Drag & drop your project folder
3. Done! You get a free `.netlify.app` URL

### Option B – GitHub Pages
1. Upload to GitHub repository
2. Go to Settings → Pages → Deploy from main branch

### Option C – Vercel
1. Install Vercel CLI or connect GitHub repo
2. Deploy instantly

---

## WhatsApp Contact
Already configured to: +91 6381390026  
Clicking the WhatsApp button opens a chat directly.

## Contact Details in Footer
- Phone: 6381390026
- Email: thaham06@gmail.com  
- Instagram: @se7en.inn

---

## What's Included

✅ Red/Black/White SE7EN branded theme  
✅ Product grid with category filters  
✅ Size selector modal  
✅ Cart sidebar  
✅ Address form  
✅ Razorpay payment integration  
✅ Supabase order storage  
✅ WhatsApp float button  
✅ Mobile responsive  
✅ Marquee banner  
✅ Toast notifications  
✅ Smooth animations  
