/**
 * A fully customizable Voronoi diagram, adapted from: {@link https://gist.github.com/njvack/1405439}
 * @example
 * let id = "chart"; // <div id="chart"></div>
 * let w = 960;
 * let h = 500;
 *
 * let vertices = d3.range(100).map(function(d) {
 *     return [Math.random() * w, Math.random() * h];
 * }
 *
 * let v = new Voronoi(id, w, h, vertices);
 */
class Voronoi {
	/**
	 * Creates and draws a Voronoi diagram.
	 * @constructor
	 * @param {string} id - The id of the element to display the chart inside.
	 * @param {number} w - The width of the chart.
	 * @param {number} h - The height of the chart.
	 * @param {Object[]} v - The array of vertices to be drawn.
	 */
	constructor (id, w, h, v) {
		this.init(id, w, h, v);
	}

	/**
	 * Recontruct the object with new values and redraw the chart.
	 * @param {string} id - The id of the element to display the chart under.
	 * @param {number} w - The width of the chart.
	 * @param {number} h - The height of the chart.
	 * @param {Object[]} v - The array of vertices to be drawn.
	 */
	init (id, w, h, v) {
		this._id = id;
		this._w = w;
		this._h = h;
		this._v = v;

		this._r = 20;
		this._c = d3.rgb(230, 230, 230);
		this._ch = d3.rgb(31, 120, 180);
		this._o = 0.4;
		this._s = d3.rgb(200, 200, 200);

		this._pr = 2;
		this._pc = d3.rgb(0, 0, 0);
		this._pch = d3.rgb(31, 120, 180);

		this._oh = null;

		this.redraw();
	}

	/**
	 * Clears everything inside [chartId]{@link Voronoi#chartId} and redraws the diagram.
	 */
	redraw () {
		this._svg = d3.select('#' + this._id)
			.html('')
			.append('svg:svg')
			.attr('width', this._w)
			.attr('height', this._h);

		this._clips = this._svg.append('svg:g').attr('id', 'point-clips');
		this._points = this._svg.append('svg:g').attr('id', 'points');
		this._paths = this._svg.append('svg:g').attr('id', 'point-paths');

		if (this._r > 0) {
			this._drawClips();
		}
		this._drawPaths();
		this._drawPoints();
	}

	/**
	 * Draws a circle around each point which will clip each region.
	 * @private
	 */
	_drawClips () {
		this._clips.selectAll('clipPath')
			.data(this._v)
			.enter().append('svg:clipPath')
				.attr('id', (d, i) => 'clip-' + i)
			.append('svg:circle')
				.attr('cx', (d) => d[0])
				.attr('cy', (d) => d[1])
				.attr('r', this._r);
	}

	/**
	 * Draws the region around each point.
	 * @private
	 */
	_drawPaths () {
		const t = this;
		this._paths.selectAll('path')
			.data(function () {
				const geom = d3.geom.voronoi(t._v.map(d => d.slice(0, 2)));
				const d = [];
				for (let i = 0; i < geom.length; i += 1) {
					d.push([geom[i], t._v[i][2]]);
				}
				return d;
			}())
			.enter().append('svg:path')
				.attr('d', (d) => 'M' + d[0].join(',') + 'Z')
				.attr('id', (d, i) => 'path-' + i)
				.attr('clip-path', (d, i) => 'url(#clip-' + i + ')')
				.style('fill', this._c)
				.style('fill-opacity', this._o)
				.style('stroke', this._s);

		this._paths.selectAll('path')
			.on('mouseover', function (d, i) {
				d3.select(this)
					.style('fill', t._ch);
				t._svg.select('circle#point-' + i)
					.style('fill', t._pch);
				if (t._oh != null) {
					t._oh(d[1]);
				}
			})
			.on('mouseout', function (d, i) {
				d3.select(this)
					.style('fill', t._c);
				t._svg.select('circle#point-' + i)
					.style('fill', t._pc);
			});
	}

	/**
	 * Draws a point at the position of each vertex.
	 * @private
	 */
	_drawPoints () {
		this._points.selectAll('circle')
			.data(this._v)
			.enter().append('svg:circle')
				.attr('id', (d, i) => 'point-' + i)
				.attr('transform', (d) => 'translate(' + d.slice(0, 2) + ')')
				.attr('r', this._pr)
				.attr('stroke', 'none')
				.style('fill', this._pc);
	}

	/**
	 * Select an array of vertices from a string in DSV format
	 * @static
	 * @param {string} text - The data in DSV format.
	 * @param {string} [columnSep=","] - The delimeter that seperates columns in text.
	 * @param {string} [lineSep="\n"] - The newline character that seperates the rows in text.
	 * @param {number} [xColumn=0] - The column position for the x-axis of the vertices.
	 * @param {number} [yColumn=1] - The column position for the y-axis of the vertices.
	 * @param {number} [overlap=0] - The minimum distance squared between 2 points before they are merged.
	 * @param {bool} [addData=false] - Whether or not to include the other data along with the vertex coordinates.
	 * @returns {Object[]} An array of vertices selected from text.
	 * @example
	 * let text = "0,0;1,1;2,4;3,9;4,16;5,25";
	 * // returns [[0, 0], [1, 1], [2, 4], [3, 9], [4, 16], [5, 15]]
	 * getVertices(text, ",", ";", 0, 1);
	 * @example
	 * let text = "point0,0,0;point1,1,1;point2,2,4;point3,3,9;point4,4,16;point5,5,25";
	 * // returns [[0, 0], [1, 1], [2, 4], [3, 9], [4, 16], [5, 15]]
	 * getVertices(text, ",", ";", 1, 2);
	 * @example
	 * let text = "point0,0,0;point1,1,1;point2,2,4;point3,3,9;point4,4,16;point5,5,25";
	 * // returns [[0, 0, "point0,0,0"], [1, 1, "point1,1,1"], [2, 4, "point2,2,4"], [3, 9, "point3,3,9"], [4, 16, "point4,4,16"], [5, 15, "point5,5,25"]]
	 * getVertices(text, ",", ";", 1, 2, true);
	 */
	static getVertices (text, columnSep = ',', lineSep = '\n', xColumn = 0, yColumn = 1, overlap = 0, addData = false) {
		const vertices = [];
		for (const line of text.split(lineSep)) {
			const row = line.split(columnSep);
			const x = row[xColumn];
			const y = row[yColumn];

			if (!isNaN(x) && !isNaN(y)) {
				let v = [+x, +y];
				if (addData) {
					v.push(row);
				}
				if (overlap > 0) {
					for (const v2 of vertices) {
						if ((v[0] - v2[0]) ** 2 + (v[1] - v2[1]) ** 2 < overlap) {
							v = null;
							break;
						}
					}
				}
				if (v != null) {
					vertices.push(v);
				}
			}
		}
		return vertices;
	}

	/**
	 * The ID of the HTML element that the chart is indside.
	 * @type {string}
	 */
	get chartId () {
		return this._id;
	}

	/**
	 * The width of the diagram.
	 * @type {number}
	 */
	get width () {
		return this._w;
	}

	/**
	 * The height of the diagram.
	 * @type {number}
	 */
	get height () {
		return this._h;
	}

	/**
	 * The array of vertices that the diagram draws.
	 * @type {number[][]}
	 */
	get vertices () {
		return this._v;
	}

	/**
	 * The radius around each vertex which limits it's region (0 for no limit).
	 * @type {number}
	 */
	get radius () {
		return this._r;
	}

	set radius (r) {
		const redraw = this._r <= 0 || r <= 0;
		this._r = r;
		if (redraw) {
			this.redraw();
		} else {
			this._clips.selectAll('clipPath')
				.select('circle')
					.attr('r', r);
		}
	}

	/**
	 * The colour of each region (d3.Color).
	 * @type {Object}
	 */
	get colour () {
		return this._c;
	}

	set colour (c) {
		this._c = c;
		this._paths.selectAll('path')
			.style('fill', c);
	}

	/**
	 * The colour of each region when hovered over (d3.Color).
	 * @type {Object}
	 */
	get colourHover () {
		return this._ch;
	}

	set colourHover (ch) {
		this._ch = ch;
	}

	/**
	 * The opacity of each region.
	 * @type {number}
	 */
	get opacity () {
		return this._o;
	}

	set opacity (o) {
		this._o = o;
		this._paths.selectAll('path')
			.style('fill-opacity', o);
	}

	/**
	 * The stroke colour around each region (d3.Color).
	 * @type {Object}
	 */
	get stroke () {
		return this._s;
	}

	set stroke (s) {
		this._s = s;
		this._paths.selectAll('path')
			.style('stroke', s);
	}

	/**
	 * The size of each point.
	 * @type {number}
	 */
	get pointRadius () {
		return this._pr;
	}

	set pointRadius (pr) {
		this._pr = pr;
		this._points.selectAll('circle')
			.attr('r', pr);
	}

	/**
	 * The colour of each point (d3.Color)
	 * @type {Object}
	 */
	get pointColour () {
		return this._pc;
	}

	set pointColour (pc) {
		this._pc = pc;
		this._points.selectAll('circle')
			.style('fill', pc);
	}

	/**
	 * The colour of each point when hovered over (d3.Color)
	 * @type {Object}
	 */
	get pointColourHover () {
		return this._pch;
	}

	set pointColourHover (pch) {
		this._pch = pch;
	}

	/**
	 * Callback function that is called when the mouse hovers over a region.
	 * @type {Voronoi~vertexCallback}
	 */
	get onHover () {
		return this._oh;
	}

	set onHover (oh) {
		this._oh = oh;
	}

	/**
	 * Function that returns the data of a vertex.
	 * @callback Voronoi~vertexCallback
	 * @param {Object[]} d - An array containing the data of a vertex.
	 */
}
