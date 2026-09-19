import express from 'express'
import { chromium } from 'playwright'
import { createAttentionRouter } from '../server/attention/routes.js'
import { InMemoryAttentionStore } from '../server/attention/store.js'
import { spawn } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
const secret = 'local-browser-audit-secret-20260918-only'
const store = new InMemoryAttentionStore()
const app = express()
app.use((req,res,next)=>{res.set('Access-Control-Allow-Origin','http://127.0.0.1:4311');res.set('Access-Control-Allow-Headers','content-type,x-installation-token,authorization');res.set('Access-Control-Allow-Methods','GET,PUT,POST,DELETE,OPTIONS');if(req.method==='OPTIONS')res.sendStatus(204);else next()})
app.use(express.json())
app.use('/api',createAttentionRouter({store,env:{BETA_ADMIN_SECRET:secret}}).router)
const server = await new Promise(resolve=>{const s=app.listen(4310,'127.0.0.1',()=>resolve(s))})
const vite = spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4311','--strictPort'],{
  env:{...process.env,VITE_BETA_INVITES_ENABLED:'true',VITE_ATTENTION_API_BASE:'http://127.0.0.1:4310',VERCEL_GIT_COMMIT_SHA:'843613cecb0e93b44b017c512575bebb43cb90ef'},stdio:'ignore',
})
let browser
const out={checks:[],errors:[]}
const check=(name,actual,expected)=>out.checks.push({name,actual,expected,pass:JSON.stringify(actual)===JSON.stringify(expected)})
try {
  for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:4311')).ok)break}catch{}await new Promise(r=>setTimeout(r,500))}
  browser=await chromium.launch({headless:true})
  const ctx=await browser.newContext({viewport:{width:390,height:844}})
  const page=await ctx.newPage()
  page.setDefaultTimeout(12000)
  page.on('pageerror',e=>out.errors.push(e.message))
  const url='http://127.0.0.1:4311'
  await page.goto(url+'/game/dashboard')
  await page.locator('#beta-code').waitFor()
  check('deep-link requires invitation',await page.locator('#beta-code').isVisible(),true)
  check('no analytics before gate',store.listAllAnalyticsEvents(new Date(0)).length,0)
  const issue=await fetch('http://127.0.0.1:4310/api/admin/beta-invites',{method:'POST',headers:{Authorization:'Bearer '+secret}})
  const invite=await issue.json()
  await page.locator('#beta-code').fill('x'.repeat(32))
  await page.getByRole('button',{name:'GÅ VIDARE'}).click()
  await page.getByRole('alert').waitFor()
  check('invalid code feedback',await page.getByRole('alert').isVisible(),true)
  await page.locator('#beta-code').fill(invite.code)
  await page.getByRole('button',{name:'GÅ VIDARE'}).click()
  await page.locator('#beta-code').waitFor({state:'detached'})
  check('valid invitation opens application',await page.locator('#beta-code').count(),0)
  await page.reload()
  await page.waitForFunction(()=>!document.body.textContent.includes('Kontrollerar tillträde'))
  check('reload retains access',await page.locator('#beta-code').count(),0)
  await store.revokeBetaInvite(invite.id)
  await page.reload()
  await page.locator('#beta-code').waitFor()
  check('reload detects revocation',await page.locator('#beta-code').isVisible(),true)
  await page.route('**/api/beta/access/**',route=>route.abort())
  await page.reload()
  await page.getByRole('button',{name:'FÖRSÖK IGEN'}).waitFor()
  check('network failure gives retry',await page.getByRole('button',{name:'FÖRSÖK IGEN'}).isVisible(),true)
  await page.unroute('**/api/beta/access/**')
  await page.getByRole('button',{name:'FÖRSÖK IGEN'}).click()
  await page.locator('#beta-code').waitFor()
  check('retry recovers',await page.locator('#beta-code').isVisible(),true)
  const adminCtx=await browser.newContext({viewport:{width:390,height:844}})
  const admin=await adminCtx.newPage()
  admin.setDefaultTimeout(12000)
  const before=store.listAllAnalyticsEvents(new Date(0)).length
  await admin.goto(url+'/admin/beta')
  await admin.locator('input[type=password]').waitFor()
  await admin.waitForTimeout(500)
  const after=store.listAllAnalyticsEvents(new Date(0)).slice(before)
  check('admin login page does not create gameplay analytics',after.map(e=>e.event).sort(),[])
  await admin.locator('input[type=password]').fill(secret)
  await admin.getByRole('button',{name:'VISA STATISTIK'}).click()
  await admin.getByRole('button',{name:'SKAPA INBJUDAN'}).waitFor()
  const beforeInvites=store.listBetaInvites().length
  await admin.route('**/api/admin/beta-invites',async route=>{
    if(route.request().method()==='POST')await new Promise(r=>setTimeout(r,500))
    await route.continue()
  })
  await admin.getByRole('button',{name:'SKAPA INBJUDAN'}).dblclick()
  await admin.waitForTimeout(1200)
  check('double click creates only one invitation',store.listBetaInvites().length-beforeInvites,1)
  await admin.unroute('**/api/admin/beta-invites')
  await admin.getByRole('button',{name:'KLAR',exact:true}).click()
  await admin.route('**/api/admin/beta-invites',async route=>{
    if(route.request().method()==='POST')await new Promise(r=>setTimeout(r,800))
    await route.continue()
  })
  await admin.getByRole('button',{name:'SKAPA INBJUDAN'}).click()
  await admin.getByRole('button',{name:'LÅS VYN',exact:true}).click()
  await admin.waitForTimeout(1400)
  check('lock survives in-flight response',await admin.locator('input[type=password]').isVisible(),true)
  await admin.screenshot({path:'audit-beta-admin.png',fullPage:true})
} catch(e){out.errors.push(e.stack)} finally {
  if(browser)await browser.close()
  vite.kill('SIGTERM')
  server.closeAllConnections()
  await new Promise(r=>server.close(r))
  await writeFile('audit-beta-browser.json',JSON.stringify(out,null,2))
  console.log(JSON.stringify(out,null,2))
}
