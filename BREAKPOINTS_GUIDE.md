# VoltPath Responsive Breakpoints Guide

## Breakpoint System

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEVICE BREAKPOINTS                            │
├─────────────┬──────────┬──────────┬──────────┬──────────────────┤
│   Compact   │  Mobile  │  Tablet  │ Desktop  │      Wide        │
│   < 380px   │ 380-720px│ 720-1024 │1024-1440 │    > 1440px      │
└─────────────┴──────────┴──────────┴──────────┴──────────────────┘
```

## Detailed Breakpoints

### 1. Compact (< 380px)
**Devices**: Small phones (iPhone SE, older Android)
- Horizontal Padding: **16px**
- Grid Columns: **1**
- Font Scale: **0.85x - 1.0x**
- Tab Bar Height: **60px**
- Card Width: **Full width - 32px**

### 2. Narrow (< 360px)
**Devices**: Very small phones
- Special handling for ultra-compact layouts
- Reduced map bottom card height
- Smaller chip widths (130px)

### 3. Mobile (380px - 720px)
**Devices**: Standard phones (iPhone 14, Pixel, Galaxy)
- Horizontal Padding: **20px**
- Grid Columns: **1**
- Font Scale: **1.0x**
- Tab Bar Height: **64px**
- Card Width: **Full width - 40px**
- Content Max Width: **None**

### 4. Tablet (720px - 1024px)
**Devices**: iPads, Android tablets
- Horizontal Padding: **32px**
- Grid Columns: **2-3** (depending on orientation)
- Font Scale: **1.0x - 1.1x**
- Tab Bar Height: **72px**
- Card Width: **42% of screen**
- Content Max Width: **680px**
- Layout: Side-by-side where appropriate

### 5. Desktop (1024px - 1440px)
**Devices**: Laptops, small desktop monitors
- Horizontal Padding: **40px**
- Grid Columns: **3**
- Font Scale: **1.1x - 1.15x**
- Tab Bar Height: **76px**
- Card Width: **28% of screen**
- Content Max Width: **960px**
- Layout: Multi-column grids

### 6. Wide (> 1440px)
**Devices**: Large monitors, ultra-wide displays
- Horizontal Padding: **48px**
- Grid Columns: **4**
- Font Scale: **1.15x - 1.2x**
- Tab Bar Height: **76px**
- Card Width: **22% of screen**
- Content Max Width: **1200px**
- Layout: Maximum columns, centered content

## Component Sizing Matrix

| Component          | Compact | Mobile | Tablet | Desktop | Wide  |
|-------------------|---------|--------|--------|---------|-------|
| Icon (small)      | 14px    | 14px   | 14px   | 16px    | 16px  |
| Icon (medium)     | 20px    | 20px   | 20px   | 22px    | 22px  |
| Icon (large)      | 32px    | 32px   | 32px   | 36px    | 36px  |
| Title Text        | 26px    | 26px   | 28px   | 32px    | 34px  |
| Hero Title        | 36px    | 36px   | 36px   | 44px    | 48px  |
| Body Text         | 14px    | 14px   | 14px   | 15px    | 16px  |
| Button Height     | 44px    | 48px   | 52px   | 56px    | 60px  |
| Card Padding      | 16px    | 18px   | 20px   | 22px    | 24px  |
| Modal Max Width   | 100%    | 100%   | 500px  | 560px   | 600px |
| Login Max Width   | 100%    | 100%   | 420px  | 480px   | 520px |

## Grid System

### Quick Actions Grid
```
Mobile:    [────────────]  (1 column)
           [────────────]
           [────────────]

Tablet:    [─────][─────]  (2 columns)
           [─────][─────]

Desktop:   [───][───][───]  (3 columns)

Wide:      [──][──][──][──]  (4 columns)
```

### Station Cards Grid
```
Mobile:    → [Card] [Card] [Card] →  (Horizontal scroll)

Tablet:    [────────][────────]      (2 columns)
           [────────][────────]

Desktop:   [─────][─────][─────]     (3 columns)
           [─────][─────][─────]

Wide:      [────][────][────][────]  (4 columns)
```

## Typography Scale

### Heading Sizes
```
                Compact  Mobile  Tablet  Desktop  Wide
Hero Title:     36px     36px    36px    44px     48px
Page Title:     26px     26px    28px    32px     34px
Section Title:  18px     18px    20px    22px     24px
Card Title:     16px     16px    16px    17px     18px
```

### Body Text Sizes
```
                Compact  Mobile  Tablet  Desktop  Wide
Large Body:     16px     16px    16px    17px     18px
Body:           14px     14px    14px    15px     16px
Small:          12px     12px    12px    13px     14px
Caption:        11px     11px    11px    12px     12px
```

## Spacing Scale

### Padding
```
Component       Compact  Mobile  Tablet  Desktop  Wide
Screen Edge:    16px     20px    32px    40px     48px
Card:           16px     18px    20px    22px     24px
Button:         12px     14px    16px    18px     20px
```

### Gaps
```
Component       Compact  Mobile  Tablet  Desktop  Wide
Grid Gap:       12px     12px    14px    16px     18px
Stack Gap:      8px      8px     10px    12px     14px
Inline Gap:     6px      6px     8px     8px      10px
```

## Usage Examples

### In Components
```javascript
import { useResponsive } from '../hooks/useResponsive';

function MyComponent() {
  const { 
    isCompact,    // < 380px
    isMobile,     // < 720px
    isTablet,     // 720-1024px
    isDesktop,    // 1024-1440px
    isWide,       // > 1440px
    isLargeScreen,// Desktop or Wide
    scaleFont,    // Function to scale fonts
    horizontalPadding,
    contentMaxWidth
  } = useResponsive();

  return (
    <View style={{ 
      paddingHorizontal: horizontalPadding,
      maxWidth: contentMaxWidth 
    }}>
      <Text style={{ fontSize: scaleFont(16) }}>
        Responsive Text
      </Text>
    </View>
  );
}
```

### Conditional Layouts
```javascript
// Grid vs Scroll
{isDesktop || isTablet ? (
  <View style={styles.grid}>
    {items.map(item => <Card key={item.id} />)}
  </View>
) : (
  <ScrollView horizontal>
    {items.map(item => <Card key={item.id} />)}
  </ScrollView>
)}

// Column Count
const columns = isWide ? 4 : isDesktop ? 3 : isTablet ? 2 : 1;
```

## Best Practices

1. **Always use the responsive hook** for sizing and spacing
2. **Test on all breakpoints** before considering a feature complete
3. **Use relative units** (percentages, flex) where possible
4. **Provide touch targets** of at least 44x44px on mobile
5. **Center content** on large screens with maxWidth
6. **Scale typography** appropriately for readability
7. **Adjust grid columns** based on available space
8. **Handle orientation changes** gracefully
9. **Test with font scaling** enabled (accessibility)
10. **Optimize images** for different screen densities

## Common Patterns

### Responsive Padding
```javascript
<View style={{ padding: isLargeScreen ? 24 : isTablet ? 20 : 18 }}>
```

### Responsive Typography
```javascript
<Text style={{ fontSize: scaleFont(isLargeScreen ? 18 : 16) }}>
```

### Responsive Grid
```javascript
<View style={{ 
  flexDirection: 'row', 
  flexWrap: 'wrap',
  gap: isLargeScreen ? 18 : 14 
}}>
```

### Responsive Modal
```javascript
<View style={{
  maxWidth: modalMaxWidth,
  alignSelf: 'center',
  width: '100%'
}}>
```

## Testing Checklist

- [ ] Test on iPhone SE (375px)
- [ ] Test on iPhone 14 (390px)
- [ ] Test on iPad (768px)
- [ ] Test on iPad Pro (1024px)
- [ ] Test on MacBook (1440px)
- [ ] Test on 4K monitor (2560px)
- [ ] Test portrait orientation
- [ ] Test landscape orientation
- [ ] Test with 85% font scale
- [ ] Test with 120% font scale
- [ ] Verify touch targets
- [ ] Check text readability
- [ ] Verify proper alignment
- [ ] Check for layout shifts
