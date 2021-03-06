import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, TemplateRef, ViewChild } from '@angular/core';
import { fakeAsync, inject, tick, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { dispatchMouseEvent } from '../core/testing';

import { NZ_NOTIFICATION_CONFIG } from './nz-notification-config';
import { NzNotificationModule } from './nz-notification.module';
import { NzNotificationService } from './nz-notification.service';

describe('NzNotification', () => {
  let messageService: NzNotificationService;
  let overlayContainer: OverlayContainer;
  let overlayContainerElement: HTMLElement;
  let demoAppFixture: ComponentFixture<DemoAppComponent>;

  beforeEach(fakeAsync(() => {
    TestBed.configureTestingModule({
      imports     : [ NzNotificationModule, NoopAnimationsModule ],
      declarations: [ DemoAppComponent ],
      providers   : [ { provide: NZ_NOTIFICATION_CONFIG, useValue: { nzMaxStack: 2 } } ] // Override default config
    });

    TestBed.compileComponents();
  }));

  beforeEach(inject([ NzNotificationService, OverlayContainer ], (m: NzNotificationService, oc: OverlayContainer) => {
    messageService = m;
    overlayContainer = oc;
    overlayContainerElement = oc.getContainerElement();
  }));

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  beforeEach(() => {
    demoAppFixture = TestBed.createComponent(DemoAppComponent);
  });

  it('should open a message box with success', (() => {
    messageService.success('test-title', 'SUCCESS');
    demoAppFixture.detectChanges();

    expect(overlayContainerElement.textContent).toContain('SUCCESS');
    expect(overlayContainerElement.querySelector('.ant-notification-notice-icon-success')).not.toBeNull();
  }));

  it('should open a message box with error', (() => {
    messageService.error('test-title', 'ERROR');
    demoAppFixture.detectChanges();

    expect(overlayContainerElement.textContent).toContain('ERROR');
    expect(overlayContainerElement.querySelector('.ant-notification-notice-icon-error')).not.toBeNull();
  }));

  it('should open a message box with warning', (() => {
    messageService.warning('test-title', 'WARNING');
    demoAppFixture.detectChanges();

    expect(overlayContainerElement.textContent).toContain('WARNING');
    expect(overlayContainerElement.querySelector('.ant-notification-notice-icon-warning')).not.toBeNull();
  }));

  it('should open a message box with info', (() => {
    messageService.info('test-title', 'INFO');
    demoAppFixture.detectChanges();

    expect(overlayContainerElement.textContent).toContain('INFO');
    expect(overlayContainerElement.querySelector('.ant-notification-notice-icon-info')).not.toBeNull();
  }));

  it('should open a message box with blank', (() => {
    messageService.blank('test-title', 'BLANK');
    demoAppFixture.detectChanges();

    expect(overlayContainerElement.textContent).toContain('BLANK');
    expect(overlayContainerElement.querySelector('.ant-notification-notice-icon')).toBeNull();
  }));

  it('should auto closed by 1s', fakeAsync(() => {
    messageService.create(null, null, 'EXISTS', { nzDuration: 1000 });
    demoAppFixture.detectChanges();

    expect(overlayContainerElement.textContent).toContain('EXISTS');

    tick(1200 + 10); // Wait for animation with 200ms
    expect(overlayContainerElement.textContent).not.toContain('EXISTS');
  }));

  it('should not destroy when hovered', fakeAsync(() => {
    messageService.create(null, null, 'EXISTS', { nzDuration: 3000 });
    demoAppFixture.detectChanges();

    const messageElement = overlayContainerElement.querySelector('.ant-notification-notice');
    dispatchMouseEvent(messageElement, 'mouseenter');
    tick(50000);
    expect(overlayContainerElement.textContent).toContain('EXISTS');

    dispatchMouseEvent(messageElement, 'mouseleave');
    tick(5000);
    expect(overlayContainerElement.textContent).not.toContain('EXISTS');
  }));

  it('should not destroyed automatically but manually', fakeAsync(() => {
    const filledMessage = messageService.success('title', 'SUCCESS', { nzDuration: 0 });
    demoAppFixture.detectChanges();

    tick(50000);
    expect(overlayContainerElement.textContent).toContain('SUCCESS');

    messageService.remove(filledMessage.messageId);
    demoAppFixture.detectChanges();
    expect(overlayContainerElement.textContent).not.toContain('SUCCESS');
  }));

  it('should keep the balance of messages length and then remove all', fakeAsync(() => {
    [ 1, 2, 3 ].forEach(id => {
      const content = `SUCCESS-${id}`;
      messageService.success(null, content);
      demoAppFixture.detectChanges();
      tick();
      demoAppFixture.detectChanges();

      expect(overlayContainerElement.textContent).toContain(content);
      if (id === 3) {
        expect(overlayContainerElement.textContent).not.toContain('SUCCESS-1');
        expect((messageService as any)._container.messages.length).toBe(2); // tslint:disable-line:no-any
      }
    });

    messageService.remove();
    demoAppFixture.detectChanges();
    expect(overlayContainerElement.textContent).not.toContain('SUCCESS-3');
    expect((messageService as any)._container.messages.length).toBe(0); // tslint:disable-line:no-any
  }));

  it('should destroy without animation', fakeAsync(() => {
    messageService.error(null, 'EXISTS', { nzDuration: 1000, nzAnimate: false });
    demoAppFixture.detectChanges();
    tick(1000 + 10);
    expect(overlayContainerElement.textContent).not.toContain('EXISTS');
  }));

  it('should reset default config dynamically', fakeAsync(() => {
    messageService.config({ nzDuration: 0 });
    messageService.create(null, 'loading', 'EXISTS');
    demoAppFixture.detectChanges();
    tick(50000);
    expect(overlayContainerElement.textContent).toContain('EXISTS');
  }));

  it('should show with placement of topLeft', () => {
    messageService.config({ nzPlacement: 'topLeft' });
    messageService.create(null, null, 'EXISTS');
    demoAppFixture.detectChanges();
    expect(overlayContainerElement.textContent).toContain('EXISTS');
    expect(overlayContainerElement.querySelector('.ant-notification-topLeft')).not.toBeNull();
  });

  // Should support nzData as context.
  it('should open a message box with template ref', () => {
    messageService.template(demoAppFixture.componentInstance.demoTemplateRef, { nzData: 'data' });
    demoAppFixture.detectChanges();
    expect(overlayContainerElement.textContent).toContain('test template contentdata');
  });

  it('should update an existing notification when keys are matched', () => {
    messageService.create(null, null, 'EXISTS', { nzKey: 'exists' });
    expect(overlayContainerElement.textContent).toContain('EXISTS');
    messageService.create('success', 'Title', 'SHOULD NOT CHANGE', { nzKey: 'exists' });
    expect(overlayContainerElement.textContent).not.toContain('EXISTS');
    expect(overlayContainerElement.textContent).toContain('Title');
    expect(overlayContainerElement.textContent).toContain('SHOULD NOT CHANGE');
    expect(overlayContainerElement.querySelector('.ant-notification-notice-icon-success')).not.toBeNull();
  });

  it('should receive `true` when it is closed by user', fakeAsync(() => {
    let onCloseFlag = false;

    messageService.create(null, null, 'close').onClose.subscribe(user => {
      if (user) {
        onCloseFlag = true;
      }
    });

    demoAppFixture.detectChanges();
    tick(1000);
    const closeEl = overlayContainerElement.querySelector('.ant-notification-notice-close');
    dispatchMouseEvent(closeEl, 'click');
    tick(1000);
    expect(onCloseFlag).toBeTruthy();
    tick(50000);
  }));
});

@Component({
  selector: 'nz-demo-app-component',
  template: `
    <ng-template let-data="data">{{ 'test template content' }}{{ data }}</ng-template>
  `
})
export class DemoAppComponent {
  @ViewChild(TemplateRef) demoTemplateRef: TemplateRef<{}>;
}
