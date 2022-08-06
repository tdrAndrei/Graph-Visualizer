    const INF = 10000000000000;
    
    let nodeCount, edgeCount;
    nodeCount = edgeCount = 0;

    function adjust(col, amt) {

      var usePound = false;
  
      if (col[0] == "#") {
          col = col.slice(1);
          usePound = true;
      }
  
      var R = parseInt(col.substring(0,2),16);
      var G = parseInt(col.substring(2,4),16);
      var B = parseInt(col.substring(4,6),16);
  
      R = R - amt;
      G = G - amt;
      B = B - amt;
  
      if (R > 255) R = 255;
      else if (R < 0) R = 0;
  
      if (G > 255) G = 255;
      else if (G < 0) G = 0;
  
      if (B > 255) B = 255;
      else if (B < 0) B = 0;
  
      var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
      var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
      var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));
  
      return (usePound?"#":"") + RR + GG + BB;
  
    }

    sigma.classes.graph.addMethod('createNode', function(nodeId) {
        let node = this.nodes(nodeId);
        if( node == undefined ) {
            node = {
                id: nodeId,
                label: nodeId,
                x: Math.random(),
                y: Math.random(),
                size: 50,
            };
            this.addNode(node);
            nodeCount ++;
        }
    })

    sigma.classes.graph.addMethod('createEdge', function(nodeId1, nodeId2, cost, graphState) {
        let edgeDegree = 0;
        let arrowType = 'arrow';
        if( graphState == 'undirected' )
          arrowType = 'none';

        let edgeList = this.edges();
        for( let i = 0; i < edgeList.length; i ++ ) {
          if( (edgeList[i].source == nodeId1 && edgeList[i].target == nodeId2) || 
              (edgeList[i].source == nodeId2 && edgeList[i].target == nodeId1 && graphState == 'directed') ) {
            edgeDegree += 10;
          }
        }
        
        if( edgeDegree > 0 ) {
          arrowType = 'curvedArrow';
          if( graphState == 'undirected' )
            arrowType = 'curve'; 
        }

        edge = {
            id: edgeCount + '_' + nodeId1 + '_' + nodeId2 + '_' + cost,
            source: nodeId1,
            target: nodeId2,
            label: cost,
            size: 1,
            type: arrowType,
            count: edgeDegree,
        };
        this.addEdge(edge);
        edgeCount ++;
     })

    sigma.classes.graph.addMethod('showComponent', function( source ) {
      let viz = new Map();
      DFS(this, viz, source);
    })
    
    function BFS( sources, graph ) {
      if( graph.labelCount > 0 )
        return ;
      
      let queue = new Array();
      let st = 0;
      let viz = new Map();
      for( let i = 0; i < sources.length; i ++ ) {
        viz.set(sources[i], true);
        queue.push({
            nodeId : sources[i],
            dist : 0,
          });
      }

      let longestPath = -1;
      let toColor = new Array();
      while( queue.length > 0 ) {
        let nodeObject = graph.nodes(queue[0].nodeId);
        let dist = queue[0].dist;
        queue = queue.slice(1);

        if( longestPath < dist )
          longestPath = dist;
        
        toColor.push({
          nodeObject: nodeObject,
          coef: dist, 
        })

        let outEdges = getOutEdges(graph, nodeObject.id);
        for( let i = 0; i < outEdges.length; i ++ ) {
          if( !viz.has(outEdges[i].target) ) {
            let newDist = dist + 1;
            queue.push({
              nodeId : outEdges[i].target,
              dist : newDist,
            });
            viz.set(outEdges[i].target, true);
            outEdges[i].label = null;
          }
        }
      }
      
      for( let i = 0; i < toColor.length; i ++ ) 
        toColor[i].nodeObject.color = adjust( '#ffff00', Math.round( 225 * (toColor[i].coef / longestPath) ) );
    }

    function shortestPath( graph, sources ) {
      if( graph.labelCount != edgeCount )
        return ;
      
      let dp = new Map();

      let queue = new Array();
      for( let i = 0; i < 1; i ++ )  {
        queue.push({
          nodeId: sources[i],
          dist: 0,
        });
      }

      let nodeArr = graph.nodes();
      for( let i = 0; i < nodeArr.length; i ++ ) 
        dp.set(nodeArr[i].id, INF);
      
      while( queue.length > 0 ) {
        let nodeObject = graph.nodes(queue[0].nodeId);
        let dist = queue[0].dist;
        queue = queue.slice(1);

        if( dist < dp.get(nodeObject.id) ) {
          dp.set(nodeObject.id, dist);
          let edges = getOutEdges(graph, nodeObject.id);
          for( let i = 0; i < edges.length; i ++ ) {
            let newDist = dist + parseInt(edges[i].label);
            if( newDist < dp.get(edges[i].target) ) {
              queue.push({
                nodeId: edges[i].target,
                dist: newDist,
              });
            }
          }
        }
      }

      let maxDist = -1;
      for( let i = 0; i < nodeArr.length; i ++ ) {
        if( dp.get(nodeArr[i].id) > maxDist ) {
          maxDist = dp.get(nodeArr[i].id);
        }
        if( sources.length == 1 )
          nodeArr[i].label += ", cost: " + dp.get(nodeArr[i].id).toString();
      }
      
      if( sources.length == 1 ) {
        for( let i = 0; i < nodeArr.length; i ++ ) {
          let coef = dp.get(nodeArr[i].id);
          nodeArr[i].color = adjust( '#ffff00', Math.round( 225 * (coef / maxDist) ) );
        }
      }
      else {
        for( let i = 1; i < sources.length; i ++ ) {
          let path = getReversePath(graph, sources[i], sources[0], dp);
          graph.nodes(sources[i]).label += ", cost: " + dp.get(sources[i]).toString();
          for( let j = 0; j < path.length; j ++ ) {
            path[j].color = '#ff0000';
            getReverseEdge(path[j], graph).color = '#ff0000';
          }
        }
      }
    }

    function getTeams( graph, nodeId, sets, team ) {
      if( sets[nodeId] != undefined ) {
        if( sets[nodeId] != team )
          return 0;
        else 
          return 1;
      }

      sets[nodeId] =  team;
      let edges = getOutEdges(graph, nodeId);

      for( let i = 0; i < edges.length; i ++ ) {
        let dest = edges[i].target;

        if( sets[dest] == undefined ) {
          if( !getTeams(graph, dest, sets, team ^ 1 ^ 2) ) {
            return 0;
          }
        }
        else if( sets[dest] == team ) {
          return 0;
        }
      }

      return 1;
    }

    function isBipartite( graph, sets ) {
      let nodeArr = graph.nodes();
      let ans = 1;
      for( let i = 0; i < nodeArr.length; i ++ ) {
        let nodeId = nodeArr[i].id;
        if( sets[nodeId] == undefined ) {
          ans = ans & getTeams(graph, nodeArr[i].id, sets, 1);
        }
      }
      return ans;
    }

    function pairup( nodeId, viz, graph, p ) {

      if( viz[nodeId] )
        return 0;

      viz[nodeId] = 1;
      const edges = getOutEdges(graph, nodeId);
      for( let i = 0; i < edges.length; i ++ ) {
        let dest = edges[i].target;
        if( !p[dest] || pairup( p[dest], viz, graph, p ) ) {
          p[dest] = nodeId;
          p[nodeId] =  dest;
          return 1;
        }
      }
      return 0;
    }

    function bipartiteMatching( graph ) {
      let sets = new Object();
      let ans = isBipartite(graph, sets);
      if( graph.graphState == 'directed' || ans == 0 )
        return ;
      
      let p = new Object();
      for( let i = 1; i <= graph.nodeCount; i ++ )
        p[i] = 0;

      let gasit = 0;
      do{
        gasit = 0;
        
        let viz = new Object;
        for( let i = 1; i <= graph.nodeCount; i ++ )
          viz[i] = 0;

        for( nodeId in sets ) {
          if( sets[nodeId] == 1 ) {
            if( !p[nodeId] && pairup( nodeId, viz, graph, p) ) {
              gasit = 1;
            }
          }
        }

      }while( gasit );

      let edgeArr = graph.edges();
    
      for( let i = 0; i < edgeArr.length; i ++ ) {
        if( p[edgeArr[i].source] != undefined && p[edgeArr[i].source] == edgeArr[i].target ) {
          edgeArr[i].color = '#FF0000';
        }
      }
    }

    function getReverseEdge( edge, graph ) {
      let edgeArr = graph.edges();
      for( let i = 0; i < edgeArr.length; i ++ ) {
        if( edgeArr[i].source == edge.target && edgeArr[i].target == edge.source && edgeArr[i].label == edge.label )
          return edgeArr[i];
      }
      return null;
    }

    function getReversePath( graph, dest, source, dp ) {
      let ans = new Array();
      
      while( dest != source ) {
        let edges = getInEdges(graph, dest);
        for( let i = 0; i < edges.length; i ++ ) {
          if( dp.get(edges[i].source) + parseInt(edges[i].label) == dp.get(dest) ) {
            dest = edges[i].source;
            ans.push(edges[i]);
            break;
          }
        }
      }

      return ans;
    }

    function getInEdges( graph, nodeId ) {
      let edgeList = graph.edges();
      let ans = new Array();

      for( let i = 0; i < edgeList.length; i ++ ) {
        if( edgeList[i].target == nodeId ) {
          ans.push(edgeList[i]);
        }
      }

      return ans;
    }

    function getOutEdges( graph, nodeId ) {
      let edgeList = graph.edges();
      let ans = new Array();

      for( let i = 0; i < edgeList.length; i ++ ) {
        if( edgeList[i].source == nodeId ) {
          ans.push(edgeList[i]);
        }
      }

      return ans;
    }

    function DFS( graph, viz, nodeId ) {
      viz.set(nodeId, true);
      let nodeObject = graph.nodes(nodeId);
      if( nodeObject == null )
        return;
      
      nodeObject.color = '#FF0000';
      let edgeList = getOutEdges(graph, nodeId);
      for( let i = 0; i < edgeList.length; i ++ ) {
        if( !viz.has(edgeList[i].target) )
          DFS(graph, viz, edgeList[i].target);
      }

      return ;
    }

    function buildGraph( graph, useForce ) {

      var persistentNodes = graph.nodes();
      var persistentEdges = graph.edges();

      graph.clear();
      nodeCount = edgeCount = 0;

      if( s.isForceAtlas2Running() )
        s.killForceAtlas2();
      clearTimeout(forceId);

      let text = editor.getValue();
      let lines = new Array;
      lines = text.split('\n');
      
      for( let i = 0; i < lines.length; i ++ ) {
        let params = lines[i].match(/\b(\w+)\b/g);
        if( params == null )
          break;
        if( params[0] != undefined )
          graph.createNode(params[0]);
        else
          break;
        if( params[1] != undefined ) 
          graph.createNode(params[1]);
        else 
          break;
        let cost = null;
        if( params[2] != undefined ) 
          cost = params[2];

        graph.createEdge(params[0], params[1], cost, graph.graphState);  
        if(graph.graphState == 'undirected' )
          graph.createEdge(params[1], params[0], cost, graph.graphState);  
      }
      
      let edges = graph.edges();
      graph.labelCount = 0;
      for( let i = 0; i < edges.length; i ++ ) {
        if( edges[i].label != null )
          graph.labelCount ++;
      }

      let originalNodes = 0;
      for( let i = 0; i < graph.nodes().length; i ++ ) {
        for( let j = 0; j < persistentNodes.length; j ++ ) {
          if( graph.nodes()[i].id == persistentNodes[j].id ) {
            graph.nodes()[i].x = persistentNodes[j].x;
            graph.nodes()[i].y = persistentNodes[j].y;
            originalNodes ++;
            break; 
          }
        }
      }   

      let originalEdges = 0;
      for( let i = 0; i < persistentEdges.length; i ++ ) {
        for( let j = 0; j < edges.length; j ++ ) {
          if( persistentEdges[i].source == edges[j].source && 
              persistentEdges[i].target == edges[j].target ) {
            originalEdges ++;
            break;
          }
        }
      }

      if( originalNodes == nodeCount && originalEdges == edgeCount )
        useForce = false;

      s.refresh();

      if( useForce == false )
        return ;

      s.startForceAtlas2(config);
      forceId = setTimeout(function() {
          s.killForceAtlas2();
      }, 500);
    }

    var s = new sigma({                                                                                                          
      renderer: {                                                        
          container: "container",                                        
          type: "canvas"                                                 
      },                                                                                                                               
    });  

    s.settings({
      defaultNodeColor: '#222',
      defaultLabelColor: '#222',
      defaultLabelSize: 20,
      defaultLabelHoverColor: '#000',
      defaultLabelAlignment: 'inside',
      labelThreshold: 6,
      font: 'Arial',
      edgeColor: 'source',
      defaultEdgeType: 'line',
      defaultEdgeArrow: 'target',
      drawEdgeLabels: true,
      edgeLabelSize: 'fixed',
      defaultEdgeLabelSize: 20,
      defaultEdgeLabelColor: '#FF0000',
      minNodeSize: 1,
      maxNodeSize: 15,
      minEdgeSize: 1,
      maxEdgeSize: 3,
      zoomMultiply: 1,
      sideMargin: 3,
      autoRescale: 'nodePosition',
    });

    let config = {
      barnesHutOptimize: false,
      gravity: 0.1,
      strongGravityMode: true,
      outboundAttractionDistribution: true,
      scalingRatio: 2,
    }

    let myGraph = s.graph;
    s.graph.read(myGraph);
    myGraph.graphState = 'undirected';
    myGraph.labelCount = 0;

    s.startForceAtlas2(config);
    let forceId = setTimeout(function() {
        s.killForceAtlas2();
    }, 1000);

    let dragListener = sigma.plugins.dragNodes(s, s.renderers[0]);
    let dragIsOn = true;
    s.refresh();

    var editor = ace.edit("userInput");
    editor.on('change', function(e) {
      if( e.action == 'insert' && (e.lines[0] == '' || e.lines[0] == ' ') )
        return ;
      buildGraph(myGraph, true);
    });

    var cmdEditor = ace.edit("commandPrompt");
    function update() {
      var shouldShow = !cmdEditor.session.getValue().length;
      var node = cmdEditor.renderer.emptyMessageNode;
      if (!shouldShow && node) {
          cmdEditor.renderer.scroller.removeChild(cmdEditor.renderer.emptyMessageNode);
          cmdEditor.renderer.emptyMessageNode = null;
      } else if (shouldShow && !node) {
          node = cmdEditor.renderer.emptyMessageNode = document.createElement("div");
          node.textContent = "Commands:\ndirected/undirected\nreset\n__BFS(node1, node2...)\n__SP(source1, source2...)\n__SC(node)\n__MATCH\n"
          node.className = "ace_emptyMessage"
          node.style.padding = "0 9px"
          node.style.position = "absolute"
          node.style.zIndex = 9
          node.style.opacity = 0.5
          cmdEditor.renderer.scroller.appendChild(node);
      }
    }
    cmdEditor.on("input", update);
    setTimeout(update, 100);
    
    function getCommandName( text ) {
      let i = 0;
      while( text[i] != '(' && i < text.length )
        i ++;
      return i;
    }

    function removeSpaces( str ) {
      let i = 0;
      while( i < str.length && str[i] == ' ' )
        i ++;

      let j = str.length - 1;
      while( j >= 0 && str[j] == ' ' )
        j --;
        
      return str.substr(i, j - i + 1);
    }

    function paramList( text ) {
      let i = 0;
      if( i == text.length )
        return ;
      
      let params = new Array;
      let j = i + 1;
      while( text[i] != ')' && i < text.length ) {
        if( text[i] == ',' ) {
          params.push( removeSpaces(text.substr(j, i - j)) );
          j = i + 1;
        }
        i ++;
      }
      if( text[i] == ')' ) {
        params.push( removeSpaces(text.substr(j, i - j)) );
      }

      return params;
    }

    function parseInput( e ) {

      let text = cmdEditor.getValue().split('\n');
      if( text.length > 2 )
        return ;
      text = removeSpaces(text[0]);

      if( text[0] == text[1] && text[0] == '_' )
        text = text.slice(2);
      else {
        let toBuild = true;
        switch( removeSpaces(text.toLowerCase()) ) {  
          case 'reset':  break;
          case 'directed' : myGraph.graphState = 'directed'; break;
          case 'undirected' : myGraph.graphState = 'undirected'; break;
          default: toBuild = false; 
        }
        if( toBuild ) {
          buildGraph(myGraph, false);
          s.refresh();
        }

        return ;
      }
      let index = getCommandName(text);
      let commandName = removeSpaces(text.substr(0, index)).toUpperCase();
      text = text.slice(index);
      if( commandName != 'MATCH' && text.length < 3  )
        return ;
        
      let params = paramList(text);
      if( commandName != 'MATCH' && params.length == 0 )
        return ;
      
      return { 
        commandName: commandName, 
        params: params,
      };
    }

    cmdEditor.on("change", function(e) {
      if( !(e.action == "insert" && e.lines[0] == '') )
        return ;
      
      let cmdData = parseInput(e);
      if( cmdData != null ) {
        buildGraph(myGraph, false);
        switch( cmdData.commandName ) {
          case 'SP' : shortestPath(myGraph, cmdData.params); break;
          case 'BFS' : BFS(cmdData.params, myGraph); break;
          case 'SC'  : myGraph.showComponent(cmdData.params[0]); break;
          case 'MATCH' : bipartiteMatching(myGraph); break;
        }

        s.refresh();
      }

      cmdEditor.setValue('');
    });

