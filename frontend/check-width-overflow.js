// Standalone script to check message bubble width and overflow using Playwright
import { chromium } from 'playwright';

async function checkWidthAndOverflow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5174');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Look for message bubble with bg-muted class
    const messageBubbles = await page.locator('div.bg-muted.text-foreground').all();
    
    if (messageBubbles.length === 0) {
      console.log('No message bubbles found. You may need to send a message first.');
      console.log('Trying to find element by checking all divs with specific classes...');
      
      // Try to find by checking computed styles
      const allDivs = await page.locator('div').all();
      let foundBubble = null;
      
      for (const div of allDivs) {
        const classes = await div.getAttribute('class') || '';
        if (classes.includes('bg-muted') && classes.includes('text-foreground')) {
          const styles = await div.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              width: parseFloat(computed.width),
              minWidth: parseFloat(computed.minWidth) || 0,
              maxWidth: parseFloat(computed.maxWidth) || Infinity,
            };
          });
          
          // Check if it matches our target (min-width around 394px)
          if (styles.minWidth >= 394 || styles.width >= 394) {
            foundBubble = div;
            break;
          }
        }
      }
      
      if (!foundBubble) {
        console.log('Could not find the target message bubble.');
        await browser.close();
        return;
      }
      
      await checkElement(foundBubble, page);
    } else {
      console.log(`Found ${messageBubbles.length} message bubble(s). Checking the first one...`);
      await checkElement(messageBubbles[0], page);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

async function checkElement(element, page) {
  const dimensions = await element.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    
    return {
      width: parseFloat(styles.width),
      minWidth: parseFloat(styles.minWidth) || 0,
      maxWidth: parseFloat(styles.maxWidth) || Infinity,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      rect: {
        left: rect.left,
        right: rect.right,
        width: rect.width,
      }
    };
  });
  
  console.log('\n=== Message Bubble Dimensions ===');
  console.log('Width:', dimensions.width, 'px');
  console.log('Min Width:', dimensions.minWidth, 'px');
  console.log('Max Width:', dimensions.maxWidth === Infinity ? 'none' : dimensions.maxWidth + 'px');
  console.log('Scroll Width:', dimensions.scrollWidth, 'px');
  console.log('Client Width:', dimensions.clientWidth, 'px');
  console.log('Rect Width:', dimensions.rect.width, 'px');
  
  // Check for overflow
  const hasOverflow = dimensions.scrollWidth > dimensions.clientWidth;
  console.log('\n=== Overflow Check ===');
  console.log('Has internal overflow:', hasOverflow);
  
  if (hasOverflow) {
    console.log('⚠️  WARNING: Element has overflow!');
  } else {
    console.log('✅ No internal overflow detected');
  }
  
  // Check children overflow
  const childrenOverflow = await element.evaluate((el) => {
    const parentRect = el.getBoundingClientRect();
    const children = Array.from(el.querySelectorAll('*'));
    const issues = [];
    
    children.forEach((child, index) => {
      const childEl = child;
      const childRect = childEl.getBoundingClientRect();
      const styles = window.getComputedStyle(childEl);
      
      // Check if child overflows parent
      if (childRect.right > parentRect.right + 2) { // +2 for rounding
        issues.push({
          index,
          tag: childEl.tagName,
          className: childEl.className || '',
          right: childRect.right,
          parentRight: parentRect.right,
          overflow: childRect.right - parentRect.right,
        });
      }
      
      // Check if child has its own overflow
      if (childEl.scrollWidth > childEl.clientWidth) {
        issues.push({
          index,
          tag: childEl.tagName,
          className: childEl.className || '',
          type: 'internal_overflow',
          scrollWidth: childEl.scrollWidth,
          clientWidth: childEl.clientWidth,
        });
      }
    });
    
    return issues;
  });
  
  console.log('\n=== Children Overflow Check ===');
  if (childrenOverflow.length === 0) {
    console.log('✅ No children overflow detected');
  } else {
    console.log(`⚠️  Found ${childrenOverflow.length} overflow issue(s):`);
    childrenOverflow.forEach((issue, i) => {
      console.log(`\nIssue ${i + 1}:`);
      console.log('  Tag:', issue.tag);
      console.log('  Class:', issue.className.substring(0, 50) + (issue.className.length > 50 ? '...' : ''));
      if (issue.overflow) {
        console.log('  Overflows parent by:', issue.overflow.toFixed(2), 'px');
        console.log('  Child right edge:', issue.right.toFixed(2), 'px');
        console.log('  Parent right edge:', issue.parentRight.toFixed(2), 'px');
      }
      if (issue.type === 'internal_overflow') {
        console.log('  Has internal overflow');
        console.log('  Scroll width:', issue.scrollWidth, 'px');
        console.log('  Client width:', issue.clientWidth, 'px');
      }
    });
  }
  
  // Check specifically for flight cards
  const flightCards = await element.locator('[aria-label*="flight"]').all();
  if (flightCards.length > 0) {
    console.log(`\n=== Flight Card Check (${flightCards.length} card(s)) ===`);
    for (let i = 0; i < flightCards.length; i++) {
      const card = flightCards[i];
      const cardInfo = await card.evaluate((el, parent) => {
        const cardRect = el.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const styles = window.getComputedStyle(el);
        
        return {
          width: parseFloat(styles.width),
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          right: cardRect.right,
          parentRight: parentRect.right,
          overflows: cardRect.right > parentRect.right + 2,
        };
      }, await element.elementHandle());
      
      console.log(`\nFlight Card ${i + 1}:`);
      console.log('  Width:', cardInfo.width, 'px');
      console.log('  Scroll Width:', cardInfo.scrollWidth, 'px');
      console.log('  Client Width:', cardInfo.clientWidth, 'px');
      console.log('  Right edge:', cardInfo.right.toFixed(2), 'px');
      console.log('  Parent right edge:', cardInfo.parentRight.toFixed(2), 'px');
      console.log('  Overflows parent:', cardInfo.overflows ? '⚠️  YES' : '✅ NO');
    }
  }
  
  // Summary
  console.log('\n=== Summary ===');
  const allGood = !hasOverflow && childrenOverflow.length === 0;
  if (allGood) {
    console.log('✅ All checks passed! Width is correct and no overflow detected.');
  } else {
    console.log('⚠️  Issues found. Please review the details above.');
  }
}

checkWidthAndOverflow().catch(console.error);

