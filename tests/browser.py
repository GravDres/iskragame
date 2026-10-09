#!/usr/bin/env python3
"""Actual browser checks: native swipes, simultaneous touches and original WebGL."""
from pathlib import Path
import json
import os
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'
OUT.mkdir(exist_ok=True)
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('ISKRA_CHROMIUM'),headless=True,timeout=20000,args=[
        '--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader',
        '--enable-unsafe-swiftshader','--allow-file-access-from-files',
    ])
    page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1,has_touch=True)
    page.set_default_timeout(12000)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.goto((ROOT/'game/index.html').as_uri())
    page.wait_for_function('window.game && !document.getElementById("menu").classList.contains("hidden")')
    page.evaluate('game.setSettings({quality:"low",resolution:"540",fps:30})')
    page.wait_for_function('game.renderer.drawCalls>5')
    page.screenshot(path=str(OUT/'menu.png'))
    page.locator('[data-mode="creative"]').click()
    page.locator('#start').click()
    page.wait_for_function('game.active && !game.modal && game.visible.filter(c=>c.mesh).length>=5')
    page.screenshot(path=str(OUT/'gameplay.png'))
    # Modal touch-action must permit native scrolling, including over inventory cards.
    page.set_viewport_size({'width':844,'height':390})
    page.locator('#bag').click()
    assert page.locator('[data-item]').count()>45
    assert page.evaluate('getComputedStyle(document.body).touchAction')=='auto'
    assert page.locator('#modal-content').evaluate('e=>getComputedStyle(e).touchAction')=='pan-y'
    assert page.locator('[data-item]').first.evaluate('e=>getComputedStyle(e).touchAction')=='pan-y'
    cdp=page.context.new_cdp_session(page)
    area=page.locator('#modal-content').bounding_box()
    selected=page.evaluate('game.selectedItem()')
    x=area['x']+area['width']*.45
    y=area['y']+area['height']-25
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1}]})
    for step in range(1,9):
        cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x,'y':y-step*18,'id':1}]})
        page.wait_for_timeout(20)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    page.wait_for_timeout(150)
    assert page.locator('#modal-content').evaluate('e=>e.scrollTop')>40
    assert page.evaluate('game.ui.modalType')=='bag'
    assert page.evaluate('game.selectedItem()')==selected
    page.screenshot(path=str(OUT/'inventory.png'))
    page.locator('[data-filter="weapons"]').click()
    assert page.locator('[data-item="rifle"]').count()==1
    assert page.locator('[data-item="dirt"]').count()==0
    page.locator('[data-tab="craft"]').click()
    assert page.locator('[data-craft]').count()>20
    page.locator('[data-tab="bosses"]').click()
    assert page.locator('[data-boss]').count()==7
    page.locator('[data-boss="root"]').click()
    assert page.evaluate('game.enemies.some(e=>e.type==="root")')
    # Exactly two action buttons alongside the joystick; all weapons share one action.
    assert page.locator('#actions button').count()==2
    assert page.locator('#spells,#mine,#reload,#sprint').count()==0
    for item,label in [('pick','Копать'),('sword','Удар'),('rifle','Огонь'),('fire','Заклинание'),('dirt','Поставить')]:
        page.evaluate('(id)=>{game.hotbar[0]=id;game.selectSlot(0);game.ui.update();}',item)
        assert page.locator('#attack').get_attribute('aria-label')==label
    page.locator('#pause').click()
    page.locator('#pause-settings').click()
    page.locator('#resolution').select_option('360')
    page.wait_for_function('game.renderer.canvas.height===360')
    page.locator('#joystickSize').evaluate("e=>e.value='1.3'")
    page.locator('#joystickSize').dispatch_event('change')
    assert page.evaluate('game.settings.joystickSize')==1.3
    page.locator('#stickMode').select_option('floating')
    assert page.evaluate('game.settings.stickMode')=='floating'
    page.screenshot(path=str(OUT/'settings.png'))
    page.locator('#edit-controls').click()
    joy=page.locator('#joystick').bounding_box()
    page.mouse.move(joy['x']+joy['width']/2,joy['y']+joy['height']/2)
    page.mouse.down()
    page.mouse.move(180,250,steps=4)
    page.mouse.up()
    assert page.evaluate('!!game.settings.layout.joystick')
    page.locator('#control-done').click()
    page.locator('#modal-close').click()
    page.evaluate('game.setSettings({layout:{},joystickSize:1,buttonSize:1,hudSize:1,stickMode:"fixed",resolution:"360"});game.hotbar[0]="pistol";game.selectSlot(0);game.ui.update();')
    # Real simultaneous touches; releasing look must preserve movement and firing.
    joy=page.locator('#joystick').bounding_box()
    action=page.locator('#attack').bounding_box()
    movement={'x':joy['x']+joy['width']/2,'y':joy['y']+joy['height']/2,'id':7}
    look={'x':500,'y':150,'id':8}
    attack={'x':action['x']+action['width']/2,'y':action['y']+action['height']/2,'id':9}
    before=page.evaluate('({x:game.player.x,z:game.player.z,yaw:game.player.yaw})')
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[movement,look,attack]})
    movement['y']-=42
    look['x']+=45
    cdp.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[movement,look,attack]})
    page.wait_for_timeout(180)
    assert page.evaluate('game.input.z')>.9
    assert page.evaluate('game.input.attack') is True
    assert page.evaluate('game.player.yaw')!=before['yaw']
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[movement,attack]})
    page.wait_for_timeout(100)
    assert page.evaluate('game.input.z')>.9
    assert page.evaluate('game.input.attack') is True
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    assert page.evaluate('game.input.z')==0
    assert page.evaluate('game.input.attack') is False
    after=page.evaluate('({x:game.player.x,z:game.player.z})')
    assert before['x']!=after['x'] or before['z']!=after['z']
    page.screenshot(path=str(OUT/'mobile.png'))
    page.evaluate('game.save(true)')
    assert page.evaluate('!!localStorage.getItem("iskra.save.creative")')
    assert page.evaluate('game.lastError') is None
    assert not errors,errors
    report={'renderer':'WebGL 1 / Chromium','checks':'native inventory swipe, filters, simultaneous joystick/look/attack, contextual action, 7 bosses, crafting, settings, control editor, save','errors':errors,'drawCalls':page.evaluate('game.renderer.drawCalls'),'vertices':page.evaluate('game.renderer.vertices')}
    (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False))
    browser.close()
