# Echo Platform - Design Document

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Customer   │  │    Vendor    │  │    Admin     │     │
│  │   Interface  │  │  Dashboard   │  │    Panel     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│           │                │                 │              │
│           └────────────────┴─────────────────┘              │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │   (FastAPI)     │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼────────┐  ┌────────▼────────┐  ┌───────▼────────┐
│  AI Agent      │  │   Supabase      │  │   Pinecone     │
│  (Multi-Model) │  │   (PostgreSQL)  │  │   (Vectors)    │
└────────────────┘  └─────────────────┘  └────────────────┘
```

### 1.2 Component Architecture

#### Frontend Components
```
app/
├── (auth)/          # Authentication pages
│   └── login/
├── (public)/        # Public-facing pages
│   ├── page.jsx     # Home
│   ├── shop/        # Product listing
│   ├── cart/        # Shopping cart
│   ├── orders/      # Order history
│   └── product/     # Product details
├── store/           # Vendor dashboard
│   ├── add-product/
│   ├── manage-product/
│   └── orders/
└── admin/           # Admin panel
    ├── approve/
    ├── stores/
    └── coupons/
```

#### Backend Modules
```
backend/
├── main.py              # FastAPI app & routes
├── agent.py             # Gemini agent
├── agent_openrouter.py  # OpenRouter agent
├── agent_groq.py        # Groq agent
├── config.py            # Configuration
├── database.py          # Supabase client
├── product_db.py        # Product data access
├── retrieval.py         # Vector DB (RAG)
├── image_analyzer.py    # Vision analysis
└── indexing.py          # Document indexing
```

## 2. Data Models

### 2.1 Database Schema (Supabase)

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT CHECK (role IN ('customer', 'vendor', 'admin')),
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);
```

#### Stores Table
```sql
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Products Table
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id UUID REFERENCES stores(id),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  price DECIMAL(10,2),
  inventory INTEGER,
  images TEXT[],
  specifications JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Orders Table
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES users(id),
  store_id UUID REFERENCES stores(id),
  total_amount DECIMAL(10,2),
  status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  shipping_address JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Order Items Table
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  product_id UUID REFERENCES products(id),
  quantity INTEGER,
  price DECIMAL(10,2)
);
```

#### Conversations Table
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  brand_id TEXT,
  mode TEXT CHECK (mode IN ('PRE_PURCHASE', 'POST_PURCHASE')),
  product_id TEXT,
  model_id TEXT,
  messages JSONB[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Analytics Table
```sql
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id TEXT,
  conversation_id UUID REFERENCES conversations(id),
  product_id TEXT,
  mode TEXT,
  event_type TEXT,
  user_query TEXT,
  response_time_ms INTEGER,
  error_occurred BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Reviews Table
```sql
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id),
  user_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2.2 Product Data Model (JSON)

```json
{
  "category_name": [
    {
      "product_id": "string",
      "category": "string",
      "brand": "string",
      "name": "string",
      "models": [
        {
          "model_id": "string",
          "capacity": "string",
          "color": "string",
          "hex_color": "string",
          "dimensions_cm": [height, width, depth],
          "weight_kg": number,
          "energy_rating": "string",
          "noise_db": number,
          "price": number,
          "currency": "string",
          "warranty_years": number,
          "features": ["string"],
          "installation": "string",
          "maintenance": "string",
          "common_issues": [
            {
              "error": "string",
              "meaning": "string",
              "fix": "string"
            }
          ],
          "manual": {
            "overview": "string",
            "installation_steps": ["string"],
            "first_time_use": ["string"],
            "daily_usage": ["string"],
            "safety_guidelines": ["string"],
            "do_not": ["string"],
            "environmental_conditions": "string",
            "storage": "string"
          },
          "repair_policy": {
            "user_fixable": ["string"],
            "service_required": ["string"],
            "spare_parts_available": ["string"],
            "voids_warranty_if": ["string"]
          },
          "warranty_details": {
            "coverage": ["string"],
            "not_covered": ["string"],
            "claim_process": ["string"],
            "service_center_contact": {
              "phone": "string",
              "email": "string",
              "hours": "string"
            }
          }
        }
      ]
    }
  ]
}
```

## 3. AI Agent Design

### 3.1 Agent Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Controller                      │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Mode Selector (PRE_PURCHASE / POST_PURCHASE)    │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│         ┌────────────────┴────────────────┐            │
│         │                                  │            │
│  ┌──────▼──────┐                  ┌───────▼──────┐    │
│  │ Pre-Purchase│                  │ Post-Purchase│    │
│  │   Agent     │                  │    Agent     │    │
│  └──────┬──────┘                  └───────┬──────┘    │
│         │                                  │            │
└─────────┼──────────────────────────────────┼───────────┘
          │                                  │
    ┌─────▼─────┐                      ┌────▼─────┐
    │  Product  │                      │  Error   │
    │  Recomm.  │                      │  Lookup  │
    └─────┬─────┘                      └────┬─────┘
          │                                  │
    ┌─────▼─────────────────────────────────▼─────┐
    │         Knowledge Base Access                │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
    │  │ Product  │  │  Vector  │  │  Manual  │  │
    │  │   DB     │  │   DB     │  │   Data   │  │
    │  └──────────┘  └──────────┘  └──────────┘  │
    └──────────────────────────────────────────────┘
```

### 3.2 Agent Prompt Design

#### System Prompt Structure
```
Base Context:
- Brand identity
- Available categories
- Knowledge source priority
- Critical rules (no hallucination)

Mode-Specific Context:
- PRE_PURCHASE: Consultative sales approach
- POST_PURCHASE: Technical support approach

Dynamic Context:
- Product information
- RAG retrieved documents
- Conversation history
- Vision analysis results
```

#### PRE_PURCHASE Prompt
```
You are a Product Intelligence Agent for {BRAND_NAME}.

ROLE: Official product salesperson

TASKS:
- Explain the specific product
- Determine product fit for user needs
- Recommend correct variant (size, color, capacity)

QUESTIONS TO ASK:
- Space constraints
- Usage needs
- Budget compatibility
- Installation feasibility
- Aesthetic preferences

HONESTY REQUIREMENT:
If product is NOT suitable, say so clearly.

IMAGE ANALYSIS:
- Assess product fit in space
- Recommend placement
- Suggest color variants
- Evaluate clearance requirements
```

#### POST_PURCHASE Prompt
```
You are a Product Intelligence Agent for {BRAND_NAME}.

ROLE: Technical support engineer

TASKS:
- Diagnose issues
- Explain error codes
- Guide setup and configuration
- Provide maintenance instructions

SAFETY REQUIREMENTS:
For dangerous operations (high voltage, gas, refrigerant):
"This requires a certified service technician."

IMAGE ANALYSIS:
- Identify visible issues
- Confirm part locations
- Verify installation
```

### 3.3 Vision Analysis Design

#### Room Analysis Pipeline
```
1. Image Upload
   ↓
2. Vision Model Analysis (Qwen2-VL)
   - Room type identification
   - Space dimensions estimation
   - Color palette extraction
   - Lighting conditions
   - Existing appliances
   ↓
3. Product Fit Assessment
   - Dimension compatibility
   - Clearance requirements
   - Ventilation needs
   - Safety considerations
   ↓
4. Color Matching
   - Extract room colors
   - Match with product variants
   - Aesthetic recommendations
   ↓
5. Response Generation
```

#### Vision Analysis Output
```json
{
  "status": "success",
  "confidence": 0.85,
  "room_type": "kitchen",
  "estimated_dimensions": {
    "width_cm": 300,
    "depth_cm": 250
  },
  "dominant_colors": ["#f5f5f5", "#8b7355"],
  "lighting": "natural + overhead",
  "recommendations": {
    "product_fit": "suitable",
    "placement": "left wall",
    "color_match": "Pearl White",
    "clearance_ok": true
  }
}
```

## 4. API Design

### 4.1 Chat API

#### POST /chat
```
Request (multipart/form-data):
{
  "message": "string",
  "model_id": "string (optional)",
  "mode": "PRE_PURCHASE | POST_PURCHASE",
  "conversation_id": "string (optional)",
  "language": "string (default: en)",
  "user_id": "string (optional)",
  "images": [File] (optional)
}

Response:
{
  "response": "string",
  "mode": "string",
  "suggestions": ["string"],
  "vision_data": {
    "confidence": number,
    "analysis": "string",
    ...
  }
}
```

#### GET /history/{session_id}
```
Response:
{
  "session_id": "string",
  "messages": [
    {
      "role": "user | agent",
      "content": "string",
      "timestamp": "ISO8601"
    }
  ]
}
```

### 4.2 Product API

#### GET /products
```
Query Parameters:
- category: string (optional)

Response:
{
  "categories": ["string"],
  "all_products": {...}
}
```

#### GET /model/{model_id}
```
Response:
{
  "product": {...},
  "model": {...},
  "installation": "string",
  "maintenance": "string",
  "warranty_years": number
}
```

### 4.3 Vision API

#### POST /analyze-room
```
Request (multipart/form-data):
{
  "file": File
}

Response:
{
  "status": "success | error",
  "analysis": "string",
  "confidence": "string",
  "color_recommendation": {...}
}
```

#### POST /color-match
```
Request:
{
  "room_analysis": "string",
  "product_id": "string"
}

Response:
{
  "recommended_color": "string",
  "hex_color": "string",
  "confidence": number,
  "reasoning": "string"
}
```

## 5. Frontend Design

### 5.1 Page Structure

#### Home Page
- Hero section with featured products
- Latest products carousel
- Best selling products
- Category showcase
- Newsletter signup

#### Shop Page
- Product grid/list view
- Search and filters
- Category navigation
- Pagination
- Sort options

#### Product Detail Page
- Image gallery
- Product specifications
- Price and availability
- Add to cart button
- AI chat widget
- Reviews and ratings
- Related products

#### Cart Page
- Cart items list
- Quantity adjustment
- Remove items
- Price summary
- Checkout button

#### Vendor Dashboard
- Sales analytics
- Product management
- Order management
- Revenue tracking
- Customer reviews

#### Admin Panel
- Vendor approval
- Store management
- Coupon creation
- Platform analytics

### 5.2 Component Design

#### ProductCard Component
```jsx
<ProductCard>
  <Image />
  <ProductInfo>
    <Name />
    <Price />
    <Rating />
  </ProductInfo>
  <Actions>
    <AddToCart />
    <QuickView />
  </Actions>
</ProductCard>
```

#### ChatWidget Component
```jsx
<ChatWidget>
  <ChatHeader>
    <ModeToggle />
    <LanguageSelector />
  </ChatHeader>
  <MessageList>
    <Message role="user|agent" />
  </MessageList>
  <ChatInput>
    <TextInput />
    <ImageUpload />
    <SendButton />
  </ChatInput>
</ChatWidget>
```

### 5.3 State Management

#### Redux Store Structure
```javascript
{
  auth: {
    user: {...},
    session: {...},
    isAuthenticated: boolean
  },
  product: {
    list: [...],
    categories: [...],
    filters: {...},
    selectedProduct: {...}
  },
  cart: {
    items: [...],
    total: number,
    itemCount: number
  },
  chat: {
    messages: [...],
    mode: "PRE_PURCHASE | POST_PURCHASE",
    isLoading: boolean
  },
  vendor: {
    store: {...},
    products: [...],
    orders: [...],
    analytics: {...}
  }
}
```

## 6. Security Design

### 6.1 Authentication Flow

```
1. User visits site
   ↓
2. Click "Login"
   ↓
3. Supabase Auth UI
   ↓
4. OAuth Provider (Google, etc.)
   ↓
5. Callback to /auth/callback
   ↓
6. Set session cookie
   ↓
7. Redirect to dashboard
```

### 6.2 Authorization Rules

#### Row-Level Security (RLS)
```sql
-- Vendors can only see their own products
CREATE POLICY vendor_products ON products
  FOR ALL USING (
    store_id IN (
      SELECT id FROM stores WHERE vendor_id = auth.uid()
    )
  );

-- Customers can only see their own orders
CREATE POLICY customer_orders ON orders
  FOR SELECT USING (customer_id = auth.uid());

-- Admins can see everything
CREATE POLICY admin_all ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 6.3 API Security

#### Rate Limiting
```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)

@app.post("/chat")
@limiter.limit("10/minute")
async def chat(...):
    ...
```

#### Input Validation
```python
from pydantic import BaseModel, validator

class ChatRequest(BaseModel):
    message: str
    model_id: Optional[str]
    
    @validator('message')
    def message_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Message cannot be empty')
        return v
```

## 7. Performance Optimization

### 7.1 Frontend Optimization

#### Code Splitting
```javascript
// Dynamic imports for heavy components
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  loading: () => <ChatSkeleton />,
  ssr: false
});
```

#### Image Optimization
```jsx
<Image
  src={product.image}
  alt={product.name}
  width={300}
  height={300}
  loading="lazy"
  placeholder="blur"
/>
```

#### Caching Strategy
```javascript
// SWR for data fetching
const { data, error } = useSWR('/api/products', fetcher, {
  revalidateOnFocus: false,
  dedupingInterval: 60000
});
```

### 7.2 Backend Optimization

#### Database Connection Pooling
```python
from supabase import create_client

client = create_client(
    supabase_url,
    supabase_key,
    options={
        'pool_size': 10,
        'max_overflow': 20
    }
)
```

#### Response Caching
```python
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

@app.get("/products")
@cache(expire=3600)
async def get_products():
    ...
```

#### Async Processing
```python
import asyncio

async def process_images(images):
    tasks = [analyze_image(img) for img in images]
    results = await asyncio.gather(*tasks)
    return results
```

### 7.3 AI Optimization

#### Prompt Caching
```python
# Cache system prompts
@lru_cache(maxsize=10)
def get_system_prompt(mode: str) -> str:
    return generate_prompt(mode)
```

#### Batch Processing
```python
# Process multiple queries in batch
async def batch_embeddings(texts: List[str]):
    return embedding_model.encode(texts, batch_size=32)
```

## 8. Monitoring & Logging

### 8.1 Application Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@app.post("/chat")
async def chat(...):
    logger.info(f"Chat request from user: {user_id}")
    try:
        response = await agent.generate_response(...)
        logger.info(f"Response generated successfully")
        return response
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise
```

### 8.2 Analytics Tracking

```python
async def log_chat_analytics(
    user_id: str,
    query: str,
    response_time: int,
    mode: str
):
    await db.log_analytics(
        event_type="chat_interaction",
        user_query=query,
        response_time_ms=response_time,
        mode=mode
    )
```

### 8.3 Error Tracking

```python
from sentry_sdk import capture_exception

try:
    result = await process_request()
except Exception as e:
    capture_exception(e)
    raise HTTPException(status_code=500, detail="Internal error")
```

## 9. Deployment Architecture

### 9.1 Backend Deployment (Railway/Cloud Run)

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 9.2 Frontend Deployment (Vercel)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api_url",
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url"
  }
}
```

### 9.3 Environment Configuration

#### Backend .env
```
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=
GOOGLE_API_KEY=
GROQ_API_KEY=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=product-manuals
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
MODE=PRE_PURCHASE
BRAND_NAME=echo
FRONTEND_URL=https://echo.com
```

#### Frontend .env.local
```
NEXT_PUBLIC_API_URL=https://api.echo.com
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_CURRENCY_SYMBOL=$
```

## 10. Testing Strategy

### 10.1 Unit Tests
- Test individual functions
- Mock external dependencies
- Test edge cases

### 10.2 Integration Tests
- Test API endpoints
- Test database operations
- Test AI agent responses

### 10.3 E2E Tests
- Test user flows
- Test checkout process
- Test chat interactions

### 10.4 Performance Tests
- Load testing
- Stress testing
- Response time monitoring

## 11. Migration & Maintenance

### 11.1 Database Migrations

```sql
-- migrations/001_add_user_id.sql
ALTER TABLE conversations
ADD COLUMN user_id UUID REFERENCES users(id);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
```

### 11.2 Data Backup Strategy
- Daily automated backups
- Point-in-time recovery
- Backup retention: 30 days
- Test restore procedures monthly

### 11.3 Maintenance Windows
- Weekly maintenance: Sunday 2-4 AM UTC
- Emergency patches: As needed
- Version updates: Monthly

## 12. Documentation

### 12.1 API Documentation
- OpenAPI/Swagger specification
- Interactive API explorer
- Code examples in multiple languages

### 12.2 User Documentation
- Customer guide
- Vendor onboarding guide
- Admin manual
- FAQ section

### 12.3 Developer Documentation
- Setup instructions
- Architecture overview
- Contributing guidelines
- Code style guide
