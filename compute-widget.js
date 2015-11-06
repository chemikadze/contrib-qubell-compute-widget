(function(){

  var instanceTemplate = _.template(
    '<span class="network">' +
    '  <table>' +      
    '  <% for(var networkId in networks){ %>' +
    '    <% var item = networks[networkId] %>' +
    '    <tr>' +
    '      <td><b><%= networkId %></b></td><td>' +
    '      <td>' + 
    '          <a href="#" class="js-open-console" data-ip="<%= item.ip %>"><%= item.ip %></a>' +
    '          <a href="#" class="js-open-console" data-ip="<%= item.ipv6 %>"><%= item.ipv6 %></a>' +
    '      </td>' +       
    '    </tr>' +
    '  <% } %>' +     
    '  </table>' +
    '</span>' 
  )

  var dashboardTemplate = _.template(
    '<span class="networks-small"> ' +
    '<% for(var networkId in networks){ %>' +
    '  <% var item = networks[networkId] %>' +
    '  <a href="#" class="js-open-console" data-ip="<%= item.ip %>"><%= item.ip %></a>' +
    '  <a href="#" class="js-open-console" data-ip="<%= item.ipv6 %>"><%= item.ipv6 %></a>' +
    '<% } %>' +
    '</span>'
  )

  var consoleTemplate = _.template(
    '<div class="js-console modal hide fade">' +
    '  <div class="modal-header">' +
    '    <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>' +
    '    <h3>Component <span class="js-compute-component-id"/></h3>' +
    '  </div>' +
    '  <div class="modal-body">' +
    '  <ul class="nav nav-tabs js-compute-tabs">' +
    '    <li class="active"><a href="#execute">Execute command</a></li>' +
    '    <li class="">      <a href="#get" class="js-compute-get-tab-button">Reveal files</a></li>' +
    '    <li class="">      <a href="#put">Upload file</a></li>' +
    '  </ul>' +    
    '  <div class="tab-content">' +
    '    <div class="tab-pane compute-command-panel active" id="execute">' +
    '       <pre class="js-command-output compute-command-output">' +      
    '         <div class="js-command-output-payload"/>' +
    '       </pre>' +
    '       <button type="button" class="btn compute-command-control compute-command-button js-execute-command">Execute</button>' +
    '       <span class="compute-command-input-wrapper"><input type="text" class="compute-command-control compute-command-input js-command"/></span>' +    
    '    </div>' +
    '    <div class="tab-pane" id="get">' + 
    '       <pre class="compute-command-output">' + 
    '         <div class="js-compute-file-listing"/>' +
    '       </pre>' +
    '    </div>' +
    '    <div class="tab-pane" id="put"><input type="file"/></div>' +
    '  </div>' +
    '  </div>' +
    '</div>'
  );


  // TODO portal does not support this :(
  function serviceCall(instance, component, command, parameters, callback) {
    // $.ajax({
    //   type: "POST",
    //   url: "/api/1/services/" + instance + (component ? "." + component : "") + "/" + command,
    //   data: JSON.stringify({ arguments: parameters, includeIntermediate: true }),
    //   dataType: 'json',
    //   contentType: 'application/json',
    //   processData: false
    // }).done(function(msg) {
    //   console.log(msg);
    //   callback(msg)
    // }).error(function(msg) {
    //   console.error(msg);
    // });
    callback([{stdOut: "test", stdErr: "test", exitCode: 0}]);
  }

  function executeCommand(instance, component, command, callback) {
    serviceCall(instance, component, "compute.exec", {"command": command, timeout: 1000 * 60 * 10}, function(results) {
      var status = results[results.length - 1].exitCode;
      var stdout = "";
      var stderr = "";
      for (var i = 0; i < results.length; ++i) {
        stdout += results[i].stdOut ? results[i].stdOut : "";
        stderr += results[i].stdErr ? results[i].stdErr : "";
      }
      callback(status, stdout, stderr);
    })    
  }

  function findComputeByIp(address, submodule, scope) {
    if (submodule.interfaces 
          && submodule.interfaces.compute
          && submodule.interfaces.compute.signals
          && submodule.interfaces.compute.signals.networks) {
      var networks = submodule.interfaces.compute.signals.networks;
      for (var networkId in networks) {
        if (networks[networkId].ip == address || networks[networkId].ipv6 == address) {
          return {scope: scope, submodule: submodule};
        }
      }
    }
    if (!submodule.submodules) return;
    for (var i = 0; i < submodule.submodules.length; ++i) {
      var nested = submodule.submodules[i];
      var nestedScope = scope + (nested.componentId ? (scope ? "." : "") + nested.componentId : "");
      var result = findComputeByIp(address, submodule.submodules[i], nestedScope);
      if (result) return result;
    }
  }

  function commandHandler($console, instance, scope) {
    return function (e) {
      e.preventDefault();
      var command = $console.find(".js-command").val();
      $console.find(".js-command").val("");
      executeCommand(instance, scope, command, function(status, stdout, stderr) {
        var $container = $console.find(".js-command-output");
        var $content = $console.find(".js-command-output-payload");
        $content.append("<br/>").append($("<b/>").text("$> " + command));
        if (stdout) {
          $content.append("<br/>").append($("<span class='compute-stdout'/>").text(stdout));
        }
        if (stderr) {
          $content.append("<br/>").append($("<span class='compute-stderr'/>").text(stderr));
        }
        $container.scrollTop($content.height());
      }); 
    }
  }

  function openConsole(instance) {
    return function() {
      var focus = findComputeByIp($(this).attr("data-ip"), instance, "");
      if (!focus) return;
      var $console = $("body").find(".js-console");
      if ($console.length == 0) {
        $console = $(consoleTemplate());
        $("body").append($console);
        $console.on("click", ".close", function() {
          $console.removeClass("in");
        });
        $console.find('.js-compute-tabs a').click(function (e) {
          e.preventDefault();
          $(this).tab('show');
        });
        $console.find(".js-execute-command").click(commandHandler($console, instance, focus.scope));
        $console.find(".js-command").keypress(function (e) {
          if (e.which == 13) {
            commandHandler($console)(e);
            return false;
          }
        });
        $console.find(".js-compute-get-tab-button").click(function(e) {
          // TODO stub
          $console.find(".js-compute-file-listing").append($(
'<span>' +
'-rw-r--r--   1 root  wheel    3698 Mar 12  2013 <a href="#">sshd_config</a><br/>' +
'-r--r-----   1 root  wheel    1275 Mar 12  2013 <a href="#">sudoers</a><br/>' +
'-rw-r--r--   1 root  wheel      96 Mar 12  2013 <a href="#">syslog.conf</a><br/>' +
'-rw-r--r--   1 root  wheel    1441 Mar 12  2013 <a href="#">ttys</a><br/>' +
'-rw-r--r--   1 root  wheel       0 Aug 17  2012 <a href="#">xtab</a><br/>' +
'-r--r--r--   1 root  wheel     126 Mar 12  2013 <a href="#">zshenv</a><br/>' +
'</span>' 
          ));
        });
      }
      $console.find(".js-compute-component-id").text(focus.scope);      
      $console.attr("style", "display: block;").addClass("in");
    }
  }
  
  function ComputeInstance(property, location, instance) {
    var template;
    if (location != 'instance-dashboard') {
      template = instanceTemplate;
    } else {
      template = dashboardTemplate;
    }
    var $elements = $(template({networks: property.runtimeValue}));  
    $elements.on('click', '.js-open-console', openConsole(instance));
    if (this instanceof Node) {
      return $(this).empty().append($elements).get(0);
    } else {
      return $elements;
    }
  }

  // widget api v1
  app.propertyWidgets.getWidgetName = function(instance, returnValue, userValue){
    if(returnValue.id == 'compute.networks') return 'ComputeInstance'
    else                                     return 'Default'
  }
  app.propertyWidgets.ComputeInstance = {
    layout      : 'block',
    render      : function(instance, returnValue, userValue) {
      return $(ComputeInstance({runtimeValue: returnValue.value}, "instance", instance));
    },
    renderSmall : function(instance, returnValue, userValue) {
      return $(ComputeInstance({runtimeValue: returnValue.value}, "instance-dashboard", instance));
    }
  }

  // widget api v2
  app.widgets.registerWidgetRouter(function(property, location, instance){
    var name = property.path[0];
    if (location.indexOf('instance') == 0 && name.indexOf && name.indexOf("networks") >= 0) {
      return ComputeInstance
    }
  });

})()