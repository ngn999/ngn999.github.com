---
title: 从Lua调用C/C++
date: 2014-07-01 11:31:58
tags:
---

先说从Lua调用C代码。

## Lua调用C

Lua调用C，就是用Lua的C API写一个动态链接库，给Lua程序用。下面看个简单的样例，用C写了个adder函数，返回一个C closure。

```C
#include <lua.h>
#include <lauxlib.h>
#include <stdio.h>

static int _do_adder(lua_State* L)
{
    double base = lua_tonumber(L, lua_upvalueindex(1));
    double to_add = luaL_checknumber(L, 1);
    lua_pushnumber(L, base + to_add);

    return 1;
}

static int _adder(lua_State* L)
{
    double base = luaL_checknumber(L, 1);
    lua_pushvalue(L, 1);
    lua_pushcclosure(L, _do_adder, 1);  /* 1 upvalue */
    
    return 1;                           /* the c closure */
}

int
luaopen_add(lua_State *L)
{
    luaL_checkversion(L);
    
    luaL_Reg l[] = {
        {"adder", _adder},
        {NULL,  NULL},
    };
    luaL_newlib(L,l);
    luaL_setfuncs(L, l, 0);
    
    return 1;                           /* 返回一个结果，一个table */
}
```

编译这个so的Makefile:

```makefile
CFLAGS = -g -O0 -Wall -I. -I /usr/local/include 
LDFLAGS = -fPIC -dynamiclib -Wl,-undefined,dynamic_lookup

all:  add.so

add.so: lua-hello.c
	$(CC) $(CFLAGS) $(LDFLAGS) $^ -o $@  
{% endhighlight %}
```

生成`add.so`后，可以从lua代码里调用了：

```lua
c = require "add"
local addTwo = c.adder(2)
print(addTwo(3))                -- 5
```

add.so的入口在`luaopen_add()`,在require("add")时，就会加载add.so,并执行`luaopen_add()`,这个函数将`_adder()`注册到lua。返回了一个table(Lua里一切都是table), table里有一个`adder()`函数。

C, Lua混编，用一个Stack来交换数据，上面用到的 `luaL_checknumber()` `lua_pushvalue()`第二参数都是这个Stack的索引。

Lua只能调用lua_CFunction类型的C函数：

```C
typedef int (*lua_CFunction) (lua_State *L);
```

C函数从L里取参数，处理，将结果push进L。

Lua和C最大的不同在于：Lua无类型，Lua有GC；此外，还得留心错误处理。

实际使用时，如果**add.so**不在默认的搜索路径里，可以设置`LUA_CPATH`，这个环境变量的格式参见 [Lua手册](http://www.lua.org/manual/5.2/manual.html#pdf-package.path)。

## Lua调用C++ -- wrapper

Lua的api是C，文档，书上也都是在说怎么在Lua里调用C，很少谈到Lua调用C++，C++对象和Lua对象的方法，变量没法一一对应。要想从Lua里调用C++的成员方法，得写一层C的wrapper, 有点lua调用C，C调用C++的意思。

还是来看个实例,我们有一个C++类：

```cpp
#include <iostream>
class Sum
{
public:
    double sum(double a, double b)
    {
        return a + b;
    }
};
```

很简单,就一个成员方法,给两个 `double`,返回他们的和。

为了在Lua里使用这个类，先来写一个so:

```cpp
#include "Sum.h"
#include <lua.hpp>

extern "C" {
    static int Sum_sum(lua_State* L);
    static int Sum_new(lua_State* L);
    int luaopen_sum(lua_State* L);
}

static int
Sum_sum(lua_State* L)
{
    Sum** ud = (Sum**)lua_touserdata(L, 1);
    double a = luaL_checknumber(L, 2);
    double b = luaL_checknumber(L, 3);
    double c = (*ud)->sum(a, b);
    lua_pushnumber(L, c);

    return 1;
}

static int
Sum_new(lua_State* L)
{
    Sum** ud = static_cast<Sum**>(lua_newuserdata(L, sizeof(Sum*)));
    *ud =  new Sum;                     // ... obj
    luaL_getmetatable(L, "Sum");        // ... obj mt
    lua_setmetatable(L, -2);            // ... obj

    return 1;
}

static int
Sum_index(lua_State* L)
{
    lua_settop(L, 2);                   // obj key
    lua_getmetatable(L, -2);            // obj key mt
    lua_pushvalue(L, -2);               // obj key mt k
    lua_gettable(L, -2);                // obj key mt[k]

    return 1;
}

int
luaopen_sum(lua_State* L)
{
    luaL_checkversion(L);

    const luaL_Reg  table[]  = {
        {"new", Sum_new},
        {NULL, NULL}
    };
    const luaL_Reg metatable[] = {
        {"sum", Sum_sum},
        {"__index", Sum_index},
        {NULL, NULL}
    };

    // table, static method
    lua_newtable(L);
    luaL_setfuncs(L, table, 0);         // ... T

    lua_setglobal(L, "Sum");            // ...

    // mt, instance method
    luaL_newmetatable(L, "Sum");
    luaL_setfuncs(L, metatable, 0);
    // lua_setfield(L, -2, "metatable");
    lua_pop(L, 1);

    return 0;
}
```

这个so做的事就是，定义了一个Lua的全局table `Sum`,将类的构造函数，static方法放进去，再将类的实例方法放到一个叫做"Sum"的metatable里。

构造函数new一个C++的Sum类，将指针存到lua里的userdata, 并为这个新生成的userdata指定metatable.

编译这个so的Makefile:

```makefile
CFLAGS = -g -O0 -Wall -I. -I /usr/local/include 
LDFLAGS = -fPIC -dynamiclib -Wl,-undefined,dynamic_lookup
LIBS = -ldl -llua
CXX = g++

all:  sum.so

sum.so: lua-Sum.cpp
	$(CXX) $(CFLAGS) $(LDFLAGS) $^ -o $@
```

在Lua里测试一下：

```lua
require("sum")

local abc = Sum.new()
print(abc)
local mt = getmetatable(abc)
for k,v in pairs(mt) do 
   print(k, v)
end
print(abc:sum(40, 2))            -- 42
```

上面的例子太过简单，而且很多地方是ad hoc，如果要在真实C++项目里使用Lua, 可以考虑使用一些方便的C++ Lua绑定库,这里有一个这类库的[列表](http://lua-users.org/wiki/BindingCodeToLua)。上面实例主要参照其中的[luawrapper库](https://bitbucket.org/alexames/luawrapper)实现。

这里只说到lua调用C/C++, 真实的项目里，一般是C/C++(host程序)调用Lua(脚本), Lua里再调用C (给Lua写的so), so里再调用lua(callback函数)。
