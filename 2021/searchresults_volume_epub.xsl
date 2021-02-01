<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  >

  <!-- Global Variables -->
  <xsl:variable name="gFinalAccessStatus" select="/MBooksTop/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gLastPageturnerLink" select="/MBooksTop/MdpApp/LastPageturnerLink"/>
  <xsl:variable name="gBeginningLink" select="/MBooksTop/MdpApp/BeginningLink"/>
  <xsl:variable name="gHasPageNumbers" select="/MBooksTop/MdpApp/HasPageNumbers"/>
  <xsl:variable name="gSearchFatalError" select="/MBooksTop/MdpApp/SearchResults/SearchError"/>
  <xsl:variable name="gValidBoolean" select="/MBooksTop/MdpApp/SearchResults/ValidBooleanExpression"/>
  <xsl:variable name="gItemType" select="/MBooksTop/MBooksGlobals/ItemType" />

  <xsl:variable name="gNumTerms" select="count(/MBooksTop/MdpApp/SearchTerms/Terms/Term)"/>
  <xsl:variable name="gMultiTerm" select="/MBooksTop/MdpApp/SearchTerms/MultiTerm"/>
  <xsl:variable name="gPagesFound" select="/MBooksTop/MdpApp/SearchSummary/TotalPages"/>
  <xsl:variable name="gSearchTerms" select="/MBooksTop/MdpApp/SearchTerms/Terms"/>
  <xsl:variable name="gSearchResults" select="/MBooksTop/MdpApp/SearchResults"/>

  <xsl:variable name="gSearchOp">
    <xsl:variable name='ptsop_var' select="//CurrentCgi/Param[@name='ptsop']"/>
    <xsl:choose>
      <xsl:when test="$ptsop_var='AND' or $ptsop_var='and'">
        <xsl:text>AND</xsl:text>
      </xsl:when>
      <xsl:when test="$ptsop_var='OR' or $ptsop_var='or'">
        <xsl:text>OR</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>AND</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="vNatLangQuery">
    <xsl:call-template name="buildNatLangQuery"/>
  </xsl:variable>

  <xsl:variable name="gUsingBookReader" select="'false'"/>

  <xsl:template name="setup-extra-header-extra">
    <!-- <link rel="stylesheet" href="/pt/alicorn/css/search.css" /> -->
    <xsl:call-template name="build-css-link">
      <xsl:with-param name="href">/pt/alicorn/css/search.css</xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="detail" select="'PT Search'" />
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <ul id="skiplinks">
      <li><a href="#section">Skip to results</a></li>
      <li><a href="/cgi/ssd?id={$gHtId}">Skip to text only view of this item</a></li>
      <li><a href="#input-search-text">Skip to search in this text</a></li>
      <!-- <li><a href="#sidebar">Skip to book options</a></li> -->
    </ul>
  </xsl:template>

  <xsl:template name="contents-wait">
    <main class="main-container">
      <aside class="side-container"><xsl:call-template name="sidebar" /></aside>
      <xsl:call-template name="build-results-container" />
    </main>
  </xsl:template>

  <xsl:template name="build-main-container">
    <main class="main-container" id="main">
      <xsl:call-template name="header" />
      <div class="container container-medium flex-container container-boxed" style="">
        <div class="sidebar-container" id="sidebar" tabindex="0">
          <button class="for-mobile sidebar-toggle-button filter-group-toggle-show-button" aria-expanded="false">
            <span class="flex-space-between flex-center">
              <span class="filter-group-heading">Options</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon"><use xlink:href="#panel-collapsed"></use></svg>
            </span>
          </button>
          <xsl:call-template name="sidebar" />
        </div>
        <section class="section-container search-results-container" id="section" tabindex="0">
          <xsl:call-template name="build-results-container" />
        </section>
      </div>
    </main>
  </xsl:template>

  <!-- Results -->
  <xsl:template name="build-results-container">
    <div class="results-container">
      <xsl:call-template name="back-to-beginning-link" />
      <xsl:call-template name="embed-search-form" />
      <xsl:call-template name="msg-access-info" />
      <xsl:call-template name="build-search-summary" />
      <xsl:if test="$gPagesFound > 0">
        <!-- <xsl:call-template name="build-fisheye-links" /> -->
        <xsl:call-template name="build-results-list" />
        <xsl:call-template name="build-fisheye-links" />
      </xsl:if>
    </div>
  </xsl:template>

  <xsl:template name="back-to-beginning-link">
    <xsl:if test="$gFinalAccessStatus = 'allow'">
      <div class="back-to-beginning-link padded">
        <span>
          <img alt="">
            <xsl:attribute name="src">//common-web/graphics/triangle_left.gif</xsl:attribute>
          </img>
        </span>
        <a href="{$gBeginningLink}">Go to the beginning of the item</a>
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="msg-access-info">
    <xsl:if test="$gFinalAccessStatus='deny' and $gPagesFound > 0">
      <div class="alert alert-warning alert-block">
        <xsl:choose>
          <xsl:when test="$gRightsAttribute='26'">
            <xsl:text>Full view is not available for this item due to privacy concerns. Page numbers with matches are displayed but text snippets cannot be shown.</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>Full view is not available for this item due to copyright &#169; restrictions.</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-search-summary">
    <h2 class="offscreen">Search Results</h2>
    <xsl:variable name="page_string">
      <xsl:choose>
        <xsl:when test="$gPagesFound > 1 or $gPagesFound = 0"><xsl:text> pages </xsl:text></xsl:when>
        <xsl:when test="$gPagesFound = 1"><xsl:text> page</xsl:text></xsl:when>
        <xsl:otherwise></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="slice-end" select="/MBooksTop/MdpApp/SliceNavigationLinks/End" />
    <xsl:variable name="slice-start" select="/MBooksTop/MdpApp/SliceNavigationLinks/Start" />

    <xsl:choose>
      <xsl:when test="$gSearchFatalError='true'">
        <div class="alert alert-error alert-block">
          <xsl:text>Sorry! There was a system error while conducting your search.  Please check back later.</xsl:text>
        </div>
      </xsl:when>

      <xsl:when test="$gPagesFound = 0">
        <div class="alert alert-error alert-block">
          <xsl:text>Your search for </xsl:text>
          <span class="mdpEmp">
            <xsl:value-of select="$vNatLangQuery"/>
          </span>
          <xsl:text> did not match any pages in this item.</xsl:text>
        </div>
        <xsl:if test="$gSearchOp='OR'">
          <div class="alert alert-warning alert-block">
            "Search in this text" can fail to find matching pages if you arrived at this item from a HathiTrust search that used bibliographic metadata terms <span class="mdpEmp"><em>about</em></span> the item that do not occur <span class="mdpEmp"><em>within</em></span> it.
          </div>
        </xsl:if>
      </xsl:when>

      <xsl:when test="$slice-end >= $slice-start">
        <div class="alert alert-info alert-block">
          <p>
            <xsl:value-of select="concat('Showing ',$slice-start,' - ',$slice-end,' of ',//TotalPages,' Results for ')"/>
            <span class="mdpEmp"><xsl:value-of select="$vNatLangQuery"/></span>
          </p>
        </div>
      </xsl:when>

      <xsl:otherwise>
        <pre><xsl:value-of select="End" /> / <xsl:value-of select="Start" /></pre>
      </xsl:otherwise>
    </xsl:choose>

    <xsl:call-template name="build-repeat-search-message"/>
  </xsl:template>

  <xsl:template name="build-repeat-search-message">
    <xsl:choose>
      <xsl:when test="($gSearchOp='AND' and $gMultiTerm = 'true' )">
        <xsl:call-template name="build-repeat-search-message-or"/>
      </xsl:when>
      <xsl:when test="($gSearchOp='OR' and $gMultiTerm = 'true' and $gPagesFound > 1)">
        <xsl:call-template name="build-repeat-search-message-and"/>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-repeat-search-message-or">
    <p>
      <a href="{/MBooksTop/MdpApp/RepeatSearchLink}">Broaden your search to find pages having just <strong>one or more</strong> of your terms.</a>
    </p>
  </xsl:template>

  <xsl:template name="build-repeat-search-message-and">
    <p>
      <a href="{/MBooksTop/MdpApp/RepeatSearchLink}">Narrow your search to find just pages having <strong>all</strong> of your terms.</a>
    </p>
  </xsl:template>

  <xsl:template name="build-fisheye-links">
    <xsl:if test="/MBooksTop/MdpApp/SliceNavigationLinks/*">
      <xsl:apply-templates select="/MBooksTop/MdpApp/SliceNavigationLinks"/>
    </xsl:if>
  </xsl:template>

  <xsl:template match="SliceNavigationLinks">
    <xsl:if test="End >= Start">
      <nav class="pagination-container" aria-label="Pagination" data-total-pages="{End}" data-current-page="{Start}">
        <div class="page-advance-link">
          <xsl:if test="PrevHitsLink != ''">
            <a class="page-advance-link" href="{PrevHitsLink}">
              <i class="icomoon icomoon-arrow-left" aria-hidden="true"></i>
              <span style="margin-left: 4px">Previous page </span>
            </a>
          </xsl:if>
        </div>

        <ul class="not-mobile">
          <xsl:if test="EndPageLink[@page='first']/Href">
            <li>
              <a href="{EndPageLink[@page='first']/Href}"><xsl:value-of select="EndPageLink[@page='first']/LinkNumber"/></a>
            </li>
            <li><span class="break">...</span></li>
          </xsl:if>
          <xsl:apply-templates select="FisheyeLinks" />
          <xsl:if test="EndPageLink[@page='last']/Href">
            <li>
              <span class="break">...</span>
            </li>
            <li>
              <a href="{EndPageLink[@page='last']/Href}"><xsl:value-of select="EndPageLink[@page='last']/LinkNumber" /></a>
            </li>
          </xsl:if>
        </ul>

        <span class="for-mobile" style="white-space: nowrap">
          <xsl:if test="count(FisheyeLinks/FisheyeLink) &gt; 1">
            <xsl:text>Page </xsl:text>
            <input id="action-start-jump" name="start" type="number" size="5" min="1" max="{$gPagesFound}" value="{FisheyeLinks/FisheyeLink[Href = '']/LinkNumber}" data-sz="{//Param[@name='sz']}" style="width: 5rem; text-align: center" />
            <xsl:text>  of </xsl:text>
            <xsl:value-of select="count(FisheyeLinks/FisheyeLink)" />
          </xsl:if>
        </span>

        <div class="page-advance-link">
          <xsl:if test="NextHitsLink != ''">
            <a class="page-advance-link" href="{NextHitsLink}">
              <span style="margin-right: 4px">Next page </span>
              <i class="icomoon icomoon-arrow-right" aria-hidden="true"></i>
            </a>
          </xsl:if>
        </div>
      </nav>
    </xsl:if>
  </xsl:template>

  <xsl:template match="FisheyeLinks">
    <xsl:for-each select="FisheyeLink">
      <li>
        <xsl:choose>
          <xsl:when test="Href != ''">
            <a href="{Href}"><span class="offscreen">Results page </span><xsl:value-of select="LinkNumber" /></a>
          </xsl:when>
          <xsl:otherwise>
            <!-- active/focus -->
            <span><strong><span class="offscreen">Results page (current) </span><xsl:value-of select="LinkNumber" /></strong></span>
          </xsl:otherwise>
        </xsl:choose>
      </li>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="build-results-list">
    <xsl:for-each select="$gSearchResults/Page">
      <xsl:variable name="page_label">
        <xsl:value-of select="Label" />
      </xsl:variable>
      <article class="result">
        <h3 class="results-header">
          <xsl:text>In </xsl:text>
          <a href="{Link}" data-seq="{Sequence}" data-highlight="{Highlight}"><xsl:value-of select="$page_label" /></a>
        </h3>
        <ul class="unstyled results--list">
          <xsl:for-each select="Result">
            <li>
              <a href="{Link}" data-highlight="{Highlight}">
                <span class="visit">➤</span>
                <xsl:text>...</xsl:text>
                <xsl:apply-templates select="Kwic" />
                <xsl:text>...</xsl:text>
              </a>
            </li>
          </xsl:for-each>
        </ul>
      </article>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="ResultsContainer">

    <div id="mdpResultsContainer" role="main" data-total="{$gPagesFound}" tabindex="-1">
      <xsl:call-template name="backToBeginning" />
      <xsl:call-template name="embed-search-form" />

      <!-- copyright and snippet info -->
      <xsl:call-template name="msgAccessInfo" />

      <!-- results of search -->
      <xsl:call-template name="BuildSearchSummary" />

      <xsl:if test="$gPagesFound > 0">
        <xsl:call-template name="BuildFisheyeTable" />
        <xsl:call-template name="BuildSearchResultsList" />
        <xsl:call-template name="BuildFisheyeTable" />
      </xsl:if>
    </div>
  </xsl:template>

  <!-- Messages -->
  <!-- -->
  <xsl:template name="msgAccessInfo">
    <xsl:if test="$gFinalAccessStatus='deny' and $gPagesFound > 0">
      <div class="alert alert-warning alert-block">
        <xsl:choose>
          <xsl:when test="$gRightsAttribute='26'">
            <xsl:text>Full view is not available for this item due to privacy concerns. Page numbers with matches are displayed but text snippets cannot be shown.</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>Full view is not available for this item due to copyright &#169; restrictions.</xsl:text>
            <!-- <xsl:if test="$gLoggedIn='NO'">
              <xsl:text>  Snippets may be available for some items if you log in.</xsl:text>
            </xsl:if> -->
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </xsl:if>
  </xsl:template>

  <!-- -->
  <xsl:template name="msgRepeatSearchWithOR">
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:value-of select="/MBooksTop/MdpApp/RepeatSearchLink"/>
        </xsl:attribute>
        Broaden your search to find pages having just <span class="mdpEmp">one or more</span> of your terms.
      </xsl:element>
  </xsl:template>

  <!-- -->
  <xsl:template name="msgRepeatSearchWithAND">
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:value-of select="/MBooksTop/MdpApp/RepeatSearchLink"/>
        </xsl:attribute>
        Narrow your search to find just pages having <span class="mdpEmp">all</span> of your terms.
      </xsl:element>
  </xsl:template>

  <!-- -->
  <xsl:template name="msgRepeatSearch">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
      <xsl:text> op=</xsl:text>
      <xsl:value-of select="$gSearchOp"/>
      <xsl:text> numterms=</xsl:text>
      <xsl:value-of select="$gNumTerms"/>
      <xsl:text> multiterm=</xsl:text>
      <xsl:value-of select="$gMultiTerm"/>
      <xsl:text> pagesfound=</xsl:text>
      <xsl:value-of select="$gPagesFound"/>
    </xsl:if>

    <xsl:choose>
      <xsl:when test="($gSearchOp='AND' and $gMultiTerm = 'true' )">
        <xsl:call-template name="msgRepeatSearchWithOR"/>
      </xsl:when>
      <xsl:when test="($gSearchOp='OR' and $gMultiTerm = 'true' and $gPagesFound > 1)">
        <xsl:call-template name="msgRepeatSearchWithAND"/>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="BuildSearchResultsList">
    <ul id="mdpOuterList">
      <xsl:for-each select="$gSearchResults/Page">

        <xsl:variable name="page_label">
          <xsl:choose>
            <xsl:when test="$gHasPageNumbers='true'">
              <xsl:choose>
                <xsl:when test="PageNumber=''">
                  <xsl:text>unnumbered page</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>Page </xsl:text>
                  <xsl:value-of select="PageNumber"/>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>sequence No.</xsl:text>
              <xsl:value-of select="Sequence"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>

        <li>
          <h3>
            <xsl:choose>
              <xsl:when test="$gFinalAccessStatus='allow'">
                <xsl:element name="a">
                  <xsl:attribute name="href">
                    <xsl:value-of select="Link"/>
                  </xsl:attribute>
                  <xsl:value-of select="$page_label"/>
                </xsl:element>
              </xsl:when>
              <xsl:otherwise>
                <xsl:value-of select="$page_label"/>
              </xsl:otherwise>
            </xsl:choose>

            <xsl:element name="span">
              <xsl:attribute name="class">mdpHitCount</xsl:attribute>
              <xsl:text>&#xa0;-&#xa0;</xsl:text>
              <xsl:value-of select="Hits"/>
              <xsl:choose>
                <xsl:when test="Hits > 1">
                  <xsl:text>&#xa0;matching terms</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>&#xa0;matching term</xsl:text>
                </xsl:otherwise>
              </xsl:choose>
              <xsl:text>&#xa0;</xsl:text>
            </xsl:element>
          </h3>
          <xsl:if test="$gFinalAccessStatus='allow'">
            <ul class="mdpInnerList">
              <xsl:for-each select="Kwic">
                <li>&#x2026;<xsl:apply-templates select="."/>&#x2026;</li>
              </xsl:for-each>
            </ul>
          </xsl:if>
        </li>
      </xsl:for-each>
    </ul>
  </xsl:template>

  <!-- -->
  <xsl:template name="buildNatLangQuery">
    <xsl:choose>
      <!-- emit entire expression -->
      <xsl:when test="$gValidBoolean=1">
        <xsl:for-each select="$gSearchTerms/Term">
          <xsl:value-of select="."/>
        </xsl:for-each>
      </xsl:when>
      <!-- emit terms joined with OP -->
      <xsl:when test="$gNumTerms >= 1">
        <xsl:for-each select="$gSearchTerms/Term">
          <xsl:value-of select="."/>
          <xsl:if test="position()!=last()">
            <xsl:value-of select="concat(' ', $gSearchOp, ' ')"/>
          </xsl:if>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="embed-search-form">
    <div class="results-search-form">
      <xsl:call-template name="action-search-volume">
        <xsl:with-param name="view" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']" />
      </xsl:call-template>
    </div>
  </xsl:template>


  <!-- -->
  <xsl:template name="BuildSearchSummary">

    <xsl:element name="a">
      <xsl:attribute name="name">skipNav</xsl:attribute>
      <xsl:attribute name="id">skipNav</xsl:attribute>
    </xsl:element>

    <h2 class="offscreen">Search Results</h2>


      <xsl:variable name="page_string">
        <xsl:choose>
          <xsl:when test="$gPagesFound > 1 or $gPagesFound = 0"><xsl:text> pages </xsl:text></xsl:when>
          <xsl:when test="$gPagesFound = 1"><xsl:text> page</xsl:text></xsl:when>
          <xsl:otherwise></xsl:otherwise>
        </xsl:choose>
      </xsl:variable>

      <xsl:choose>
        <xsl:when test="$gSearchFatalError='true'">
          <div class="mdpSearchSummary">
            <div class="alert alert-error alert-block">
              <xsl:text>Sorry! There was a system error while conducting your search.  Please check back later.</xsl:text>
            </div>
          </div>
        </xsl:when>

        <xsl:when test="$gPagesFound = 0">
          <div class="mdpSearchSummary">
            <div class="alert alert-error alert-block">
              <xsl:text>Your search for </xsl:text>
              <span class="mdpEmp">
                <xsl:value-of select="$vNatLangQuery"/>
              </span>
              <xsl:text> did not match any pages in this item.</xsl:text>
            </div>
          <xsl:if test="$gSearchOp='OR'">
            <div class="alert alert-warning alert-block">
              "Search in this text" can fail to find matching pages if you arrived at this item from a HathiTrust search that used bibliographic metadata terms <span class="mdpEmp"><em>about</em></span> the item that do not occur <span class="mdpEmp"><em>within</em></span> it.
            </div>
          </xsl:if>
          </div>
        </xsl:when>
      </xsl:choose>
      <xsl:call-template name="msgRepeatSearch"/>

      <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
        <xsl:text> query time (ms) = </xsl:text>
        <xsl:value-of select="MdpApp/SearchSummary/QueryTime"/>
      </xsl:if>

  </xsl:template>


  <!-- -->
  <xsl:template match="Kwic">
    <xsl:copy-of select="./node()"/>
  </xsl:template>

  <!-- -->
  <xsl:template name="BuildFisheyeTable">
    <div class="mdpFisheye">
      <xsl:if test="/MBooksTop/MdpApp/SliceNavigationLinks/*">
        <xsl:apply-templates select="/MBooksTop/MdpApp/SliceNavigationLinks"/>
      </xsl:if>
    </div>
  </xsl:template>

  <!-- -->
  <xsl:template match="SliceNavigationLinks" mode="legacy">

	  <xsl:if test="End >= Start">
      <div class="mdpSearchSummary">
        <xsl:value-of select="concat('Showing ',Start,' - ',End,' of ',TotalPages,' Results for ')"/>
	      <span class="mdpEmp"><xsl:value-of select="$vNatLangQuery"/></span>
      </div>

      <xsl:if test="EndPageLink[@page='first']/Href">
        <span class="mdpFisheyeLink">
          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="EndPageLink[@page='first']/Href"/>
            </xsl:attribute>
	    <xsl:value-of select="EndPageLink[@page='first']/LinkNumber"/>
          </xsl:element>
        </span>
      </xsl:if>

      <xsl:if test="PrevHitsLink!=''">
        <span class="mdpFisheyeLink">
          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="PrevHitsLink"/>
            </xsl:attribute>
            <i class="icomoon icomoon-arrow-left" aria-hidden="true"></i>
            <xsl:text> </xsl:text>
            <xsl:text>Previous</xsl:text>
          </xsl:element>
        </span>
      </xsl:if>

      <xsl:apply-templates select="FisheyeLinks"/>

      <xsl:if test="NextHitsLink!=''">
        <span class="mdpFisheyeLink">
          <xsl:text>  </xsl:text>
          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="NextHitsLink"/>
            </xsl:attribute>
            <xsl:text>Next</xsl:text>
            <xsl:text> </xsl:text>
            <i class="icomoon icomoon-arrow-right" aria-hidden="true"></i>
          </xsl:element>
        </span>
      </xsl:if>

      <xsl:if test="EndPageLink[@page='last']/Href">
        <span class="mdpFisheyeLink">
          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="EndPageLink[@page='last']/Href"/>
            </xsl:attribute>
	    <xsl:value-of select="EndPageLink[@page='last']/LinkNumber"/>
          </xsl:element>
        </span>
      </xsl:if>
    </xsl:if>

  </xsl:template>

  <!-- -->
  <xsl:template match="FisheyeLinks" mode="legacy">
    <span>
      <xsl:for-each select="FisheyeLink">
        <xsl:choose>
          <!-- if there is an Href then build a link, otherwise, this is the slice in focus -->
	  <xsl:when test="Href!=''">
	    <span class="mdpFisheyeLink">
            <xsl:element name="a">
              <xsl:attribute name="href">
                <xsl:value-of select="Href"/>
              </xsl:attribute>
              <xsl:value-of select="LinkNumber"/>
            </xsl:element>
            </span>
          </xsl:when>
          <!-- slice in focus, just output the link number -->
          <xsl:otherwise>
            <span class="mdpEmp">
              <xsl:value-of select="LinkNumber"/>
            </span>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:for-each>
    </span>
  </xsl:template>

  <xsl:template name="backToBeginning">
    <xsl:if test="$gFinalAccessStatus = 'allow'">
      <div class="mdpGoToBeginning">
        <span>
         <xsl:element name="img">
           <xsl:attribute name="src">//common-web/graphics/triangle_left.gif</xsl:attribute>
           <xsl:attribute name="alt"> </xsl:attribute>
         </xsl:element>
        </span>
        <xsl:element name="a">
          <xsl:attribute name="href">
          <xsl:value-of select="$gBeginningLink"/>
          </xsl:attribute>
          Go to the beginning of the book
        </xsl:element>
      </div>
    </xsl:if>
  </xsl:template>

</xsl:stylesheet>

