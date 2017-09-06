//extending base backbone classes with some helpers
var CotModel = Backbone.Model.extend({
    get: function(key) {
        var keys = (key || '').split('.');
        var value = Backbone.Model.prototype.get.apply(this, [keys[0]]);
        if (keys.length == 1) {
            return value;
        }
        if (typeof value !== 'object') {
            return undefined;
        }
        for (var i = 1; i < keys.length && value != undefined; i++) {
            value = value[keys[i]];
        }
        return value;
    },
    set: function(key, val, options) {
        if(typeof key == 'object') {
            for(var k in key) {
                if (key.hasOwnProperty(k)) {
                    this._set(k, key[k], val);
                }
            }
        } else {
            this._set(key, val, options);
        }
        return this;
    },
    _set: function(key, val, options) {
        var keys = (key || '').split('.');
        if (keys.length == 1) {
            Backbone.Model.prototype.set.apply(this, arguments);
        } else {
            var object = this.get(keys[0]);
            if (typeof object !== 'object') {
                object = {};
            } {
                object = _.clone(object);
            }
            var lastObject = object;
            for(var i = 1 ; i < keys.length - 1; i++) {
                if (lastObject[keys[i]] === undefined) {
                    lastObject[keys[i]] = {};
                }
                lastObject = lastObject[keys[i]];
            }
            var lastKey =  keys[keys.length - 1];
            var oldValue = lastObject[lastKey];
            lastObject[lastKey] = val;
            Backbone.Model.prototype.set.apply(this, [keys[0], object]);
        }
    }
});
var CotView = Backbone.View.extend({
    localId: function(s) {
        return (this.id || this._fallbackId()) + '_' + s;
    },
    localEl: function(s) {
        return this.$('#'+this.localId(s));
    },
    _fallbackId: function() {
        this._fallbackId = this._fallbackId || Math.random().toString().split('.')[1];
        return this._fallbackId;
    },
});