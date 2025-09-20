# 🎨 UI Components Guide

## Tổng quan

Web admin đã được cải thiện với hệ thống UI/UX hiện đại, bao gồm:

- ✨ **Animations nâng cao** với Framer Motion
- 🎨 **Design System** hoàn chỉnh với theme dark/light
- 📱 **Responsive Design** cho mobile và tablet
- 🧩 **Reusable Components** với animations
- 🎯 **Micro-interactions** và hover effects

## 🚀 Các Components Mới

### 1. Layout Component
```tsx
import Layout from './components/Layout';

<Layout 
  currentPage={currentPage} 
  onPageChange={setCurrentPage}
  notifications={notifications}
>
  {/* Your content */}
</Layout>
```

**Tính năng:**
- Sidebar responsive với animations
- Dark/Light mode toggle
- Notification system
- Modern navigation

### 2. ModernDashboard Component
```tsx
import ModernDashboard from './components/ModernDashboard';

<ModernDashboard API={API} token={token} />
```

**Tính năng:**
- Animated stats cards
- Interactive charts
- Real-time data updates
- Modern gradient backgrounds

### 3. Button Component
```tsx
import Button from './components/Button';

<Button 
  variant="primary" 
  size="md" 
  onClick={handleClick}
  loading={isLoading}
  icon={<PlusIcon className="w-4 h-4" />}
>
  Click me
</Button>
```

**Variants:** `primary`, `secondary`, `danger`, `success`, `warning`, `ghost`
**Sizes:** `sm`, `md`, `lg`

### 4. Card Component
```tsx
import Card from './components/Card';

<Card 
  variant="elevated" 
  hover={true}
  onClick={handleClick}
>
  Card content
</Card>
```

**Variants:** `default`, `elevated`, `outlined`, `glass`

### 5. Modal Component
```tsx
import Modal from './components/Modal';

<Modal 
  isOpen={isOpen}
  onClose={handleClose}
  title="Modal Title"
  size="md"
>
  Modal content
</Modal>
```

**Sizes:** `sm`, `md`, `lg`, `xl`, `full`

### 6. Input Component
```tsx
import Input from './components/Input';

<Input
  label="Email"
  type="email"
  value={email}
  onChange={setEmail}
  error={emailError}
  icon={<EnvelopeIcon className="w-5 h-5" />}
/>
```

### 7. Badge Component
```tsx
import Badge from './components/Badge';

<Badge 
  variant="success" 
  size="md"
  animated={true}
>
  Success
</Badge>
```

**Variants:** `default`, `success`, `warning`, `danger`, `info`, `outline`

### 8. LoadingSpinner Component
```tsx
import LoadingSpinner from './components/LoadingSpinner';

<LoadingSpinner 
  size="lg" 
  color="primary"
  text="Loading..."
/>
```

### 9. Toast System
```tsx
import { useToast } from './hooks/useToast';

const { success, error, warning, info } = useToast();

// Usage
success('Success!', 'Operation completed successfully');
error('Error!', 'Something went wrong');
warning('Warning!', 'Please check your input');
info('Info', 'Here is some information');
```

## 🎨 CSS Variables & Theme System

### Light Mode
```css
:root {
  --primary: 59 130 246; /* blue-500 */
  --secondary: 241 245 249; /* slate-100 */
  --accent: 236 72 153; /* pink-500 */
  --background: 255 255 255;
  --foreground: 15 23 42; /* slate-900 */
  /* ... more variables */
}
```

### Dark Mode
```css
.dark {
  --primary: 59 130 246;
  --secondary: 30 41 59; /* slate-800 */
  --background: 2 6 23; /* slate-950 */
  --foreground: 248 250 252; /* slate-50 */
  /* ... more variables */
}
```

## ✨ Animation Classes

### Built-in Animations
```css
.animate-fade-in     /* Fade in with slide up */
.animate-slide-in    /* Slide in from left */
.animate-slide-up    /* Slide up from bottom */
.animate-scale-in    /* Scale in with fade */
.animate-pulse-slow  /* Slow pulse animation */
.animate-shimmer     /* Shimmer loading effect */
.animate-float       /* Floating animation */
.animate-glow        /* Glow effect */
```

### Hover Effects
```css
.hover-lift          /* Lift on hover */
.hover-glow          /* Glow on hover */
```

### Glass Morphism
```css
.glass               /* Glass morphism effect */
```

## 🎯 Micro-interactions

### Button Interactions
- Scale on hover (1.02x)
- Scale on tap (0.98x)
- Smooth transitions

### Card Interactions
- Lift on hover (-2px)
- Scale on hover (1.01x)
- Shadow changes

### Input Interactions
- Scale on focus (1.01x)
- Animated underline
- Icon animations

## 📱 Responsive Design

### Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Features
- Collapsible sidebar
- Touch-friendly buttons
- Optimized spacing
- Swipe gestures

## 🚀 Performance Optimizations

### Framer Motion
- Hardware acceleration
- Optimized animations
- Reduced re-renders

### CSS Optimizations
- CSS Variables for theming
- Efficient selectors
- Minimal repaints

## 🎨 Design Principles

### Color Palette
- Primary: Blue (#3B82F6)
- Secondary: Slate (#64748B)
- Accent: Pink (#EC4899)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)

### Typography
- Font: Inter (system font)
- Weights: 400, 500, 600, 700
- Responsive sizing

### Spacing
- Base unit: 4px
- Scale: 0.25, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16, 20, 24

### Shadows
- Small: 0 1px 3px rgba(0,0,0,0.1)
- Medium: 0 4px 6px rgba(0,0,0,0.1)
- Large: 0 10px 15px rgba(0,0,0,0.1)
- XL: 0 20px 25px rgba(0,0,0,0.1)

## 🔧 Customization

### Adding New Animations
```css
@keyframes customAnimation {
  from { /* start state */ }
  to { /* end state */ }
}

.animate-custom {
  animation: customAnimation 0.5s ease-out;
}
```

### Custom Theme Colors
```css
:root {
  --custom-color: 123 456 789;
}

.custom-bg {
  background: rgb(var(--custom-color));
}
```

## 📚 Best Practices

1. **Use semantic HTML** for accessibility
2. **Consistent spacing** using the design system
3. **Meaningful animations** that enhance UX
4. **Mobile-first** responsive design
5. **Performance** - avoid excessive animations
6. **Accessibility** - respect prefers-reduced-motion

## 🎉 Kết luận

Hệ thống UI mới cung cấp:
- ✅ Trải nghiệm người dùng hiện đại
- ✅ Animations mượt mà và có ý nghĩa
- ✅ Design system nhất quán
- ✅ Responsive design hoàn chỉnh
- ✅ Dark/Light mode
- ✅ Components tái sử dụng
- ✅ Performance tối ưu

Web admin giờ đây có giao diện chuyên nghiệp, hiện đại và thân thiện với người dùng! 🚀
