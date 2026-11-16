import { test, expect } from '@playwright/test';
test('production demo starts, pauses, resumes and has no development controls',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.getByRole('button',{name:'Начать забег'})).toBeVisible({timeout:60000});
  await page.getByRole('button',{name:'Начать забег'}).click();await expect(page.getByRole('progressbar',{name:'Здоровье'})).toBeAttached();
  await page.getByRole('button',{name:'Пауза',exact:true}).click();await expect(page.getByRole('dialog',{name:'Пауза'})).toBeVisible();
  await page.getByRole('button',{name:'Продолжить'}).click();await expect(page.getByRole('dialog',{name:'Пауза'})).toHaveCount(0);
  await expect(page.locator('canvas')).toHaveCount(1);await expect(page.getByLabel('Visual mode')).toHaveCount(0);
  expect(await page.evaluate(()=>window.__PIXEL__)).toBeUndefined();expect(errors).toEqual([]);
});
