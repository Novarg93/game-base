import { expect, it } from 'vitest';
import { HeldInputTracker } from '../../src/game/input/HeldInputTracker';
import { GamepadInputController, type GamepadState } from '../../src/game/input/GamepadInputController';
it('cleans held movement and detaches keyboard listeners',()=>{
  const target=new EventTarget(), tracker=new HeldInputTracker(target,()=>true);
  const down=()=>Object.assign(new Event('keydown'),{code:'KeyD',repeat:false,isComposing:false,altKey:false,ctrlKey:false,metaKey:false});
  target.dispatchEvent(down());expect(tracker.input()).toEqual({x:1,y:0});
  tracker.destroy();tracker.destroy();target.dispatchEvent(down());expect(tracker.input()).toEqual({x:0,y:0});
});
it('preserves gamepad polling and detaches every registered listener',()=>{
  class Target extends EventTarget {
    count=0;
    override addEventListener(...args: Parameters<EventTarget['addEventListener']>) { this.count++;super.addEventListener(...args); }
    override removeEventListener(...args: Parameters<EventTarget['removeEventListener']>) { this.count--;super.removeEventListener(...args); }
  }
  const target=new Target(), visibility=new Target();
  const axes=[0,0];
  const pad:GamepadState={index:0,connected:true,mapping:'standard',axes,buttons:Array.from({length:16},()=>({pressed:false,touched:false,value:0}))};
  const controller=new GamepadInputController({target,visibilityTarget:visibility,hidden:()=>false,read:()=>[pad],notice:()=>{},activity:()=>{}});
  controller.poll('playing');axes[0]=1;expect(controller.poll('playing').movement.x).toBeGreaterThan(.9);
  controller.destroy();controller.destroy();expect(target.count).toBe(0);expect(visibility.count).toBe(0);expect(controller.poll('playing').actions).toEqual([]);
});
