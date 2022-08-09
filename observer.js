//construtor argument is event for regist on observer inited.
//struct is 
// events = [{
//     eventName: "something event",
//     handler: ()=>{something handler},
//     context: something context object
// }]
class Observer { 
    constructor(events) {
        this.handlers = {};

        if (events)
            for (let i = 0; i < events.length; i++) {
                let event = events[i];
                this.regist(event.eventName, event.handler, event.context);
            }
    }

    once(eventName, handler, context) {
        let eventHandler = this.handlers[eventName];
        if (!eventHandler) {
            eventHandler = this.handlers[eventName] = [];
        }

        let event = {
            handler: handler,
            context: context,
            once: true,
            id: uuidv4()
        };
        eventHandler.push(event);
        return event.id;
    }

    regist(eventName, handler, context) {
        let eventHandler = this.handlers[eventName];
        if (!eventHandler) {
            eventHandler = this.handlers[eventName] = [];
        }

        let event = {
            handler: handler,
            context: context,
            once: false,
            id: uuidv4()
        };
        eventHandler.push(event);
        return event.id;
    }

    unregist(eventName, handler, context) {
        let eventHandler = this.handlers[eventName];
        if (!eventHandler) return false;
        for (let i=eventHandler.length-1; i>=0; i--) {
            let currentHandler = eventHandler[i];
            if (handler === currentHandler['handler'] &&
                context === currentHandler['context']) {
                eventHandler.splice(i, 1);
                if (eventHandler.length === 0) delete this.handlers[eventName];
                return true;
            }
        }
        
    }

    unregistById(id) {
        let found = false;
        for (let eventName in this.handlers) {
            let handlers = this.handlers[eventName];
            for (let i=handlers.length-1; i>=0; i--) {
                let handler = handlers[i];
                if (handler.id === id) {
                    handlers.splice(i,1);
                    found = true;
                }
            }
            if (found) {
                if (handlers.length === 0) delete this.handlers[eventName];
                return true;
            }
        }
        return false;
    }

    notify(eventName) {
        let eventHandler = this.handlers[eventName];
        if (eventHandler == undefined) return;

        let args = [];
        for (let i = 1; i < arguments.length; i++) {
            args.push(arguments[i]);
        }

        for(let i=eventHandler.length-1; i>=0; i--) {
            let currentHandler = eventHandler[i];
            currentHandler['handler'].call(currentHandler['context'], ...args);
            if (currentHandler.once) eventHandler.splice(i,1);
        }
    }

    removeEventName(eventName) {
        if (this.handlers[eventName])
            delete this.handlers[eventName];
    }

    reset() {
        this.handlers = {};
    }
}

const uuidv4= () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}