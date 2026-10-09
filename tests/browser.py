#!/usr/bin/env python3
"""Run the actual WebGL renderer and mobile UI in Chromium, producing evidence."""
from pathlib import Path
import json
import shutil
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'
OUT.mkdir(exist_ok=True)
errors=[]
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=[
        '--no-sandbox','--disable-dev-shm-usage','--use-angle=swiftshader',
        '--enable-unsafe-swiftshader','--allow-file-access-from-files',
        '--disable-crashpad-for-testing','--disable-breakpad','--no-zygote','--single-process',
    ])
    page=browser.new_page(viewport={'width':1280,'height':720},device_scale_factor=1,has_touch=True)
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    page.goto((ROOT/'game/index.html').as_uri())
    page.wait_for_function('window.game && !document.getElementById("menu").classList.contains("hidden")')
    page.wait_for_timeout(5000)
    assert page.evaluate('game.lastError') is None
    assert page.evaluate('game.renderer.drawCalls')>5
    page.screenshot(path=str(OUT/'menu.png'))
    page.locator('[data-mode="creative"]').click()
    page.locator('#start').click()
    page.wait_for_timeout(4000)
    assert page.evaluate('game.active && !game.modal')
    page.screenshot(path=str(OUT/'gameplay.png'))
    page.locator('#bag').click()
    page.locator('[data-tab="craft"]').click()
    assert page.locator('[data-craft]').count()>20
    page.locator('[data-tab="bosses"]').click()
    assert page.locator('[data-boss]').count()==7
    page.locator('[data-boss="root"]').click()
    page.wait_for_timeout(500)
    assert page.evaluate('game.enemies.some(e=>e.type==="root")')
    page.locator('#pause').click()
    page.locator('#pause-settings').click()
    page.locator('#resolution').select_option('360')
    page.wait_for_timeout(300)
    assert page.evaluate('game.renderer.canvas.height')==360
    page.locator('#quality').select_option('low')
    assert page.evaluate('game.world.radius')==2
    page.locator('#joystickSize').evaluate("e=>e.value='1.3'")
    page.locator('#joystickSize').dispatch_event('change')
    assert page.evaluate('game.settings.joystickSize')==1.3
    page.screenshot(path=str(OUT/'settings.png'))
    page.locator('#edit-controls').click()
    joy=page.locator('#joystick').bounding_box()
    page.mouse.move(joy['x']+joy['width']/2,joy['y']+joy['height']/2)
    page.mouse.down()
    page.mouse.move(180,470,steps=4)
    page.mouse.up()
    assert page.evaluate('!!game.settings.layout.joystick')
    page.locator('#control-done').click()
    page.locator('#modal-close').click()
    page.evaluate('game.save(true)')
    assert page.evaluate('!!localStorage.getItem("iskra.save.creative")')
    # Mobile: multitouch-style pointer events act on the joystick and camera.
    page.set_viewport_size({'width':844,'height':390})
    page.evaluate('game.setSettings({layout:{},joystickSize:1,buttonSize:1,hudSize:1,resolution:"auto"})')
    joy=page.locator('#joystick').bounding_box()
    before=page.evaluate('({x:game.player.x,z:game.player.z})')
    cdp=page.context.new_cdp_session(page)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':joy['x']+joy['width']/2,'y':joy['y']+5,'id':7}]})
    page.wait_for_timeout(400)
    cdp.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    after=page.evaluate('({x:game.player.x,z:game.player.z})')
    assert before!=after
    page.screenshot(path=str(OUT/'mobile.png'))
    assert page.evaluate('game.lastError') is None
    assert not errors,errors
    report={'renderer':'WebGL 1 / SwiftShader','checks':'menu, modes, crafting, 7 bosses, resolution, graphics, resize, control editor, save, mobile joystick','errors':errors,'drawCalls':page.evaluate('game.renderer.drawCalls'),'vertices':page.evaluate('game.renderer.vertices')}
    (OUT/'browser-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False))
    browser.close()
