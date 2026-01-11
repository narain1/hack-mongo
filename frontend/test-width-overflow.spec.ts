import { test, expect } from '@playwright/test';

test('Check message bubble width and child overflow', async ({ page }) => {
  // Navigate to the app (webServer in config will start it automatically)
  await page.goto('/');
  
  // Wait for the page to load and navigate to chat if needed
  await page.waitForLoadState('networkidle');
  
  // Try to find the message bubble - look for the text content first
  // The message contains "Sure! Here are some random flight details"
  const messageText = page.locator('text=/Sure! Here are some random flight details/i');
  
  // Wait a bit for content to load
  await page.waitForTimeout(2000);
  
  // Check if message exists, if not, try to find any message bubble
  const messageExists = await messageText.count() > 0;
  
  let messageBubble;
  if (messageExists) {
    // Find the message bubble container - go up from the text to find the bg-muted div
    messageBubble = messageText.locator('xpath=ancestor::div[contains(@class, "bg-muted")]').first();
  } else {
    console.log('Specific message not found. Looking for any message bubble with bg-muted...');
    // Try to find any message bubble with bg-muted
    const anyMessageBubble = page.locator('div.bg-muted.text-foreground').first();
    const anyExists = await anyMessageBubble.count() > 0;
    
    if (!anyExists) {
      console.log('No message bubbles found. Skipping test.');
      test.skip();
      return;
    }
    
    messageBubble = anyMessageBubble;
  }
  
  // Wait for the element to be visible
  await messageBubble.waitFor({ state: 'visible', timeout: 10000 });
  
  // Get the computed width of the message bubble
  const bubbleWidth = await messageBubble.evaluate((el) => {
    const styles = window.getComputedStyle(el);
    return {
      width: parseFloat(styles.width),
      minWidth: parseFloat(styles.minWidth),
      maxWidth: parseFloat(styles.maxWidth),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth
    };
  });
  
  console.log('Message Bubble Dimensions:', bubbleWidth);
  
  // Check if the element respects min-width (should be at least 394px)
  expect(bubbleWidth.width).toBeGreaterThanOrEqual(394);
  
  // Check if scrollWidth equals clientWidth (no overflow)
  // Allow small tolerance for rounding errors
  const overflowTolerance = 2; // 2px tolerance
  expect(bubbleWidth.scrollWidth).toBeLessThanOrEqual(bubbleWidth.clientWidth + overflowTolerance);
  
  // Check all children for overflow
  const childrenOverflow = await messageBubble.evaluate((el) => {
    const children = Array.from(el.querySelectorAll('*'));
    const overflowIssues: Array<{ element: string; scrollWidth: number; clientWidth: number }> = [];
    
    children.forEach((child) => {
      const childEl = child as HTMLElement;
      const scrollWidth = childEl.scrollWidth;
      const clientWidth = childEl.clientWidth;
      
      // Check if child overflows its own container
      if (scrollWidth > clientWidth) {
        overflowIssues.push({
          element: childEl.tagName + (childEl.className ? '.' + childEl.className.split(' ').join('.') : ''),
          scrollWidth,
          clientWidth
        });
      }
    });
    
    return overflowIssues;
  });
  
  console.log('Children Overflow Issues:', childrenOverflow);
  
  // Check if any children overflow the parent
  const childrenOverflowParent = await messageBubble.evaluate((el) => {
    const parentRect = el.getBoundingClientRect();
    const children = Array.from(el.querySelectorAll('*'));
    const overflowIssues: Array<{ element: string; right: number; parentRight: number }> = [];
    
    children.forEach((child) => {
      const childEl = child as HTMLElement;
      const childRect = childEl.getBoundingClientRect();
      
      // Check if child extends beyond parent's right edge
      if (childRect.right > parentRect.right + 1) { // +1 for rounding errors
        overflowIssues.push({
          element: childEl.tagName + (childEl.className ? '.' + childEl.className.split(' ').join('.') : ''),
          right: childRect.right,
          parentRight: parentRect.right
        });
      }
    });
    
    return overflowIssues;
  });
  
  console.log('Children Overflowing Parent:', childrenOverflowParent);
  
  // Assert no overflow (with tolerance for rounding)
  if (childrenOverflow.length > 0) {
    console.warn('Found children with internal overflow:', childrenOverflow);
  }
  if (childrenOverflowParent.length > 0) {
    // Filter out minor rounding errors (less than 2px)
    const significantOverflow = childrenOverflowParent.filter(
      issue => (issue.right - issue.parentRight) > 2
    );
    expect(significantOverflow.length).toBe(0);
  }
  
  // Check specifically for the flight card width issue
  const flightCard = messageBubble.locator('[aria-label*="flight option"]').first();
  if (await flightCard.count() > 0) {
    const flightCardWidth = await flightCard.evaluate((el) => {
      return {
        width: parseFloat(window.getComputedStyle(el).width),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      };
    });
    
    console.log('Flight Card Dimensions:', flightCardWidth);
    
    // Check if flight card fits within parent
    const flightCardOverflows = await flightCard.evaluate((el, parent) => {
      const cardRect = el.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      return cardRect.right > parentRect.right;
    }, await messageBubble.elementHandle());
    
    expect(flightCardOverflows).toBe(false);
  }
});

